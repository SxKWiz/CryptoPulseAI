"use client";

import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type HistogramData,
  ColorType,
  LineStyle,
  type UTCTimestamp,
} from "lightweight-charts";
import type { KlineData } from "@/lib/binance";

interface CryptoChartProps {
  data: KlineData[];
  symbol: string;
}

export interface CryptoChartRef {
  getChartDataUri: () => string;
  updateCandlestick: (kline: {
    time: UTCTimestamp;
    open: number;
    high: number;
    low: number;
    close: number;
  }) => void;
  updateVolume: (kline: { time: UTCTimestamp; volume: number, open: number, close: number }) => void;
}

const CryptoChart = forwardRef<CryptoChartRef, CryptoChartProps>(
  ({ data, symbol }, ref) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
    const hasInitialized = useRef(false);

    useImperativeHandle(ref, () => ({
      getChartDataUri: () => {
        if (chartRef.current) {
          return chartRef.current.takeScreenshot().toDataURL();
        }
        return "";
      },
      updateCandlestick: (kline) => {
        if (candlestickSeriesRef.current) {
          candlestickSeriesRef.current.update(kline);
        }
      },
      updateVolume: (kline) => {
        if (volumeSeriesRef.current) {
          volumeSeriesRef.current.update({
            time: kline.time,
            value: kline.volume,
            color: kline.close > kline.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
          });
        }
      },
    }));

    useEffect(() => {
      if (!chartContainerRef.current || hasInitialized.current) return;
        
      const computedStyle = getComputedStyle(document.documentElement);
      
      // Function to convert HSL values to hex format for chart library compatibility
      const hslToHex = (hslString: string): string => {
        const values = hslString.trim().split(/\s+/);
        if (values.length !== 3) return '#000000'; // fallback to black
        
        const h = parseInt(values[0]) / 360;
        const s = parseInt(values[1]) / 100;
        const l = parseInt(values[2]) / 100;
        
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
        const m = l - c / 2;
        
        let r = 0, g = 0, b = 0;
        
        if (0 <= h && h < 1/6) {
          r = c; g = x; b = 0;
        } else if (1/6 <= h && h < 2/6) {
          r = x; g = c; b = 0;
        } else if (2/6 <= h && h < 3/6) {
          r = 0; g = c; b = x;
        } else if (3/6 <= h && h < 4/6) {
          r = 0; g = x; b = c;
        } else if (4/6 <= h && h < 5/6) {
          r = x; g = 0; b = c;
        } else if (5/6 <= h && h < 1) {
          r = c; g = 0; b = x;
        }
        
        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);
        
        const toHex = (n: number) => n.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      };
      
      // Get CSS custom properties
      const cardHsl = computedStyle.getPropertyValue('--card').trim();
      const cardForegroundHsl = computedStyle.getPropertyValue('--card-foreground').trim();
      const borderHsl = computedStyle.getPropertyValue('--border').trim();
      
      // Convert to hex, with fallbacks for better visibility
      const chartBackgroundColor = cardHsl ? hslToHex(cardHsl) : '#1a1a1a';
      const textColor = cardForegroundHsl ? hslToHex(cardForegroundHsl) : '#ffffff';
      const gridColor = borderHsl ? hslToHex(borderHsl) : '#333333';

      console.log('Chart colors:', { chartBackgroundColor, textColor, gridColor });

      const handleResize = () => {
        if (chartRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current!.clientWidth,
          });
        }
      };

      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 500,
        layout: {
          background: { type: ColorType.Solid, color: chartBackgroundColor },
          textColor: textColor,
        },
        grid: {
          vertLines: { color: gridColor },
          horzLines: { color: gridColor },
        },
        crosshair: {
          mode: 1,
        },
        rightPriceScale: {
          borderColor: gridColor,
          textColor: textColor,
        },
        timeScale: {
          borderColor: gridColor,
          textColor: textColor,
        },
      });
      chartRef.current = chart;

      const candlestickSeries = chart.addCandlestickSeries({
        upColor: "#26a69a",
        downColor: "#ef5350",
        borderDownColor: "#ef5350",
        borderUpColor: "#26a69a",
        wickDownColor: "#ef5350",
        wickUpColor: "#26a69a",
      });
      candlestickSeriesRef.current = candlestickSeries;

      const volumeSeries = chart.addHistogramSeries({
        color: "#26a69a",
        priceFormat: {
          type: "volume",
        },
        priceScaleId: "", // set as an overlay
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.8, // 80% empty space
          bottom: 0,
        },
      });
      volumeSeriesRef.current = volumeSeries;
      
      chart.timeScale().fitContent();
      hasInitialized.current = true;

      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }
        hasInitialized.current = false;
      };
    }, []);

    useEffect(() => {
      if (data && data.length > 0 && candlestickSeriesRef.current && volumeSeriesRef.current) {
        console.log(`Setting chart data: ${data.length} items`, {
          first: data[0],
          last: data[data.length - 1],
          sample: data.slice(0, 3)
        });

        const candlestickData: CandlestickData[] = data.map((d) => ({
          time: d.time,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }));
        candlestickSeriesRef.current.setData(candlestickData);

        const volumeData: HistogramData[] = data.map(d => ({
          time: d.time,
          value: d.volume,
          color: d.close > d.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
        }));
        volumeSeriesRef.current.setData(volumeData);
        
        chartRef.current?.timeScale().fitContent();
        console.log('Chart data set successfully');
      } else {
        console.log('Chart data not ready:', { 
          dataLength: data?.length, 
          hasCandlestickSeries: !!candlestickSeriesRef.current,
          hasVolumeSeries: !!volumeSeriesRef.current 
        });
      }
    }, [data]);
    
    return (
      <div className="relative">
        <div ref={chartContainerRef} className="rounded-lg min-h-[500px] w-full" />
        {(!data || data.length === 0) && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/50 rounded-lg">
            <div className="text-center">
              <div className="text-muted-foreground mb-2">No chart data available</div>
              <div className="text-sm text-muted-foreground">Loading market data...</div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

CryptoChart.displayName = "CryptoChart";

export default CryptoChart;
