"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { getKlineData, type KlineData } from "@/lib/binance";
import { runFlashAnalysis, runProAnalysis } from "@/lib/actions";
import CryptoChart, { type CryptoChartRef } from "@/components/crypto-chart";
import { useToast } from "@/hooks/use-toast";
import type { AnalyzeCryptoFlashOutput } from "@/ai/flows/analyze-crypto-flash";
import type { AnalyzeCryptoProOutput } from "@/ai/flows/analyze-crypto-pro";
import { Zap, Gem, AlertTriangle, Lightbulb } from "lucide-react";
import type { UTCTimestamp } from "lightweight-charts";

type AnalysisResult = AnalyzeCryptoFlashOutput | AnalyzeCryptoProOutput;

export function CryptoDashboard() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [interval, setInterval] = useState("1h");
  const [klineData, setKlineData] = useState<KlineData[]>([]);
  const [analysisMode, setAnalysisMode] = useState<"flash" | "pro">("flash");
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [dataSource, setDataSource] = useState<"api" | "mock">("api");
  const chartRef = useRef<CryptoChartRef>(null);
  const { toast } = useToast();

  const cryptoPairs = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT"];
  const timeIntervals = ["1m", "5m", "15m", "1h", "4h", "1d"];

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const data = await getKlineData(symbol, interval);
        setKlineData(data);
        
        // Check if we're using mock data (mock data will have very recent timestamps)
        if (data.length > 0) {
          const lastTimestamp = data[data.length - 1].time as number;
          const now = Date.now() / 1000;
          const isRecent = (now - lastTimestamp) < 300; // Within 5 minutes
          setDataSource(isRecent ? "mock" : "api");
        }
        
        console.log(`Loaded ${data.length} candlesticks for ${symbol}`, data.slice(0, 3));
      } catch (error) {
        console.error("Error fetching data:", error);
        setDataSource("mock");
      }
      setIsLoading(false);
      setAnalysisResult(null); // Clear previous analysis on data change
    }
    fetchData();
  }, [symbol, interval]);

  useEffect(() => {
    if (isLoading) return; // Don't connect until initial data is loaded

    let ws: WebSocket | null = null;
    let mockInterval: NodeJS.Timeout | null = null;

    try {
      ws = new WebSocket(
        `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`
      );

      ws.onopen = () => {
        console.log("WebSocket connected");
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        const kline = message.k;

        const chartUpdate = {
          time: (kline.t / 1000) as UTCTimestamp,
          open: parseFloat(kline.o),
          high: parseFloat(kline.h),
          low: parseFloat(kline.l),
          close: parseFloat(kline.c),
          volume: parseFloat(kline.v),
        };

        chartRef.current?.updateCandlestick(chartUpdate);
        chartRef.current?.updateVolume(chartUpdate);
      };

      ws.onerror = (error) => {
        console.error("WebSocket Error:", error);
        // Fallback to mock updates when WebSocket fails
        startMockUpdates();
      };

      ws.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        if (event.code !== 1000) { // Not a normal closure
          startMockUpdates();
        }
      };
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      startMockUpdates();
    }

    function startMockUpdates() {
      if (mockInterval) return; // Already running
      
      console.log("Starting mock real-time updates");
      mockInterval = setInterval(() => {
        if (klineData.length === 0) return;
        
        const lastCandle = klineData[klineData.length - 1];
        const now = Date.now() / 1000;
        
        // Generate realistic price movement
        const volatility = 0.001; // 0.1% volatility per update
        const change = (Math.random() - 0.5) * volatility;
        const newPrice = lastCandle.close * (1 + change);
        
        const mockUpdate = {
          time: now as UTCTimestamp,
          open: lastCandle.close,
          high: Math.max(lastCandle.close, newPrice),
          low: Math.min(lastCandle.close, newPrice),
          close: newPrice,
          volume: Math.random() * 10 + 1,
        };

        chartRef.current?.updateCandlestick(mockUpdate);
        chartRef.current?.updateVolume(mockUpdate);
      }, 5000); // Update every 5 seconds
    }

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      if (mockInterval) {
        clearInterval(mockInterval);
      }
    };
  }, [symbol, interval, isLoading, klineData]);
  
  const handleAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      let result;
      if (analysisMode === "flash") {
        // Format kline data as a string for the flash model
        const chartDataString = klineData
          .slice(-50) // Use last 50 candles
          .map(d => `T: ${d.time}, O: ${d.open}, H: ${d.high}, L: ${d.low}, C: ${d.close}, V: ${d.volume}`)
          .join('; ');
        
        result = await runFlashAnalysis({
          chartData: chartDataString,
          ticker: symbol,
        });

      } else { // Pro mode
        const chartDataUri = chartRef.current?.getChartDataUri();
        if (!chartDataUri) {
          throw new Error("Could not capture chart image.");
        }
        result = await runProAnalysis({
          chartDataUri,
          cryptoPair: symbol,
          analysisObjective: "Provide a detailed technical analysis and trade signals.",
        });
      }
      setAnalysisResult(result);
    } catch (error) {
      console.error("Analysis failed", error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderAnalysisResult = () => {
    if (isAnalyzing) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-6 w-32" />
            </CardTitle>
            <CardDescription><Skeleton className="h-4 w-48" /></CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!analysisResult) {
      return (
        <Card className="flex flex-col items-center justify-center text-center p-8 h-full min-h-[300px] border-dashed">
            <Lightbulb className="w-12 h-12 text-muted-foreground mb-4"/>
            <h3 className="text-xl font-semibold">Ready for Analysis</h3>
            <p className="text-muted-foreground mt-1">Select a mode and click "Run Analysis" to get AI insights.</p>
        </Card>
      );
    }
    
    const isPro = 'analysisSummary' in analysisResult;
    const title = isPro ? "Ultra Analysis" : "Quick Analysis";
    const icon = isPro ? <Gem className="text-primary" /> : <Zap className="text-primary" />;
    const summary = isPro ? analysisResult.analysisSummary : analysisResult.analysis;
    const entry = analysisResult.entryPriceRange;
    const stopLoss = isPro ? analysisResult.stopLossLevel : analysisResult.stopLoss;
    const takeProfit = isPro ? analysisResult.takeProfitLevels.join(', ') : analysisResult.takeProfit;

    return (
      <Card className="bg-background/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">{icon} {title}</CardTitle>
          <CardDescription>{symbol} - {interval} timeframe</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground/90 mb-6">{summary}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Card className="p-4 bg-card/50">
                <CardDescription>Entry Price</CardDescription>
                <CardTitle className="text-lg text-green-400">{entry}</CardTitle>
            </Card>
            <Card className="p-4 bg-card/50">
                <CardDescription>Take Profit</CardDescription>
                <CardTitle className="text-lg text-blue-400">{takeProfit}</CardTitle>
            </Card>
            <Card className="p-4 bg-card/50">
                <CardDescription>Stop Loss</CardDescription>
                <CardTitle className="text-lg text-red-400">{stopLoss}</CardTitle>
            </Card>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <main className="flex-1 p-4 sm:p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <CardTitle>{symbol} Chart</CardTitle>
                      {dataSource === "mock" && (
                        <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20 dark:bg-yellow-400/10 dark:text-yellow-500 dark:ring-yellow-400/20">
                          Demo Data
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={symbol} onValueChange={setSymbol}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Symbol" />
                        </SelectTrigger>
                        <SelectContent>
                          {cryptoPairs.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={interval} onValueChange={setInterval}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Interval" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeIntervals.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <Skeleton className="h-[500px] w-full" />
                    ) : (
                        <CryptoChart ref={chartRef} data={klineData} symbol={symbol} />
                    )}
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Analysis Engine</CardTitle>
                <CardDescription>Choose your analysis mode and run the AI.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={analysisMode} onValueChange={(v) => setAnalysisMode(v as "flash" | "pro")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="flash"><Zap className="mr-2 h-4 w-4"/>Quick</TabsTrigger>
                    <TabsTrigger value="pro"><Gem className="mr-2 h-4 w-4"/>Ultra</TabsTrigger>
                  </TabsList>
                  <TabsContent value="flash" className="text-sm text-muted-foreground pt-2">
                    Fast analysis using Gemini 2.5 Flash. Ideal for quick market snapshots and signals.
                  </TabsContent>
                  <TabsContent value="pro" className="text-sm text-muted-foreground pt-2">
                    In-depth analysis using Gemini 2.5 Pro on the chart image for higher precision.
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter>
                 <Button onClick={handleAnalysis} disabled={isAnalyzing || isLoading} className="w-full">
                  {isAnalyzing ? "Analyzing..." : `Run ${analysisMode === 'pro' ? 'Ultra' : 'Quick'} Analysis`}
                </Button>
              </CardFooter>
            </Card>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Disclaimer</AlertTitle>
              <AlertDescription>
                AI analysis is for informational purposes only and not financial advice. Always do your own research.
              </AlertDescription>
            </Alert>
        </div>
      </div>
      
      <div className="mt-6">
        {renderAnalysisResult()}
      </div>
    </main>
  );
}
