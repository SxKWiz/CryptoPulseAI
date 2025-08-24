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
} from "lightweight-charts";
import type { KlineData } from "@/lib/binance";

interface CryptoChartProps {
  data: KlineData[];
  symbol: string;
}

export interface CryptoChartRef {
  getChartDataUri: () => string;
}

const CryptoChart = forwardRef<CryptoChartRef, CryptoChartProps>(
  ({ data, symbol }, ref) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

    useImperativeHandle(ref, () => ({
      getChartDataUri: () => {
        if (chartRef.current) {
          return chartRef.current.takeScreenshot().toDataURL();
        }
        return "";
      },
    }));

    useEffect(() => {
      if (!chartContainerRef.current) return;

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
          background: { type: ColorType.Solid, color: "#212121" },
          textColor: "rgba(255, 255, 255, 0.9)",
        },
        grid: {
          vertLines: { color: "rgba(197, 203, 206, 0.1)" },
          horzLines: { color: "rgba(197, 203, 206, 0.1)" },
        },
        crosshair: {
          mode: 1,
        },
        rightPriceScale: {
          borderColor: "rgba(197, 203, 206, 0.6)",
        },
        timeScale: {
          borderColor: "rgba(197, 203, 206, 0.6)",
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

      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
        }
      };
    }, []);

    useEffect(() => {
      if (data && data.length > 0 && candlestickSeriesRef.current && volumeSeriesRef.current) {
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
      }
    }, [data]);
    
    return <div ref={chartContainerRef} className="rounded-lg" />;
  }
);

CryptoChart.displayName = "CryptoChart";

export default CryptoChart;
