"use server";
import type { Time } from 'lightweight-charts';

export interface KlineData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function getKlineData(
  symbol: string = "BTCUSDT",
  interval: string = "1h",
  limit: number = 300
): Promise<KlineData[]> {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.statusText}`);
    }
    const data = await response.json();

    // Binance API returns an array of arrays.
    // [0: open time, 1: open, 2: high, 3: low, 4: close, 5: volume, ...]
    const formattedData: KlineData[] = data.map((d: any) => ({
      time: (d[0] / 1000) as Time, // convert ms to seconds for lightweight-charts
      open: parseFloat(d[1]),
      high: parseFloat(d[2]),
      low: parseFloat(d[3]),
      close: parseFloat(d[4]),
      volume: parseFloat(d[5]),
    }));
    return formattedData;
  } catch (error) {
    console.error("Failed to fetch Kline data:", error);
    // Return empty array or re-throw, depending on desired error handling.
    // For a UI component, returning empty is often better to avoid crashing the page.
    return [];
  }
}
