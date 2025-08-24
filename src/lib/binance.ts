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

// Mock data generator for when the API is unavailable
function generateMockData(symbol: string, interval: string, limit: number): KlineData[] {
  const basePrice = symbol.includes('BTC') ? 115000 : 
                   symbol.includes('ETH') ? 4000 : 
                   symbol.includes('BNB') ? 700 : 
                   symbol.includes('SOL') ? 220 : 
                   symbol.includes('XRP') ? 2.5 : 100;

  const intervalMs = interval === '1m' ? 60000 :
                    interval === '5m' ? 300000 :
                    interval === '15m' ? 900000 :
                    interval === '1h' ? 3600000 :
                    interval === '4h' ? 14400000 :
                    interval === '1d' ? 86400000 : 3600000;

  const now = Date.now();
  const data: KlineData[] = [];
  let currentPrice = basePrice;
  
  // Start from the earliest time and go forward
  for (let i = 0; i < limit; i++) {
    const time = (now - ((limit - 1 - i) * intervalMs)) / 1000;
    const volatility = 0.015; // 1.5% volatility
    const trend = Math.sin(i * 0.05) * 0.005; // Subtle wave pattern
    
    // Generate price movement
    const change = (Math.random() - 0.5) * volatility + trend;
    const openPrice = currentPrice;
    const closePrice = openPrice * (1 + change);
    
    // Generate realistic high/low
    const rangeFactor = Math.random() * 0.01 + 0.002; // 0.2% to 1.2% range
    const high = Math.max(openPrice, closePrice) * (1 + rangeFactor);
    const low = Math.min(openPrice, closePrice) * (1 - rangeFactor);
    
    // Volume increases with price movement
    const priceMovement = Math.abs(change);
    const baseVolume = 100;
    const volume = baseVolume * (1 + priceMovement * 10) * (0.5 + Math.random());

    data.push({
      time: time as Time,
      open: Number(openPrice.toFixed(symbol.includes('BTC') ? 0 : 2)),
      high: Number(high.toFixed(symbol.includes('BTC') ? 0 : 2)),
      low: Number(low.toFixed(symbol.includes('BTC') ? 0 : 2)),
      close: Number(closePrice.toFixed(symbol.includes('BTC') ? 0 : 2)),
      volume: Number(volume.toFixed(2)),
    });
    
    currentPrice = closePrice;
  }
  
  return data; // Data is already in chronological order
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

    // Check if the API returned an error (like geo-restriction)
    if (data && typeof data === 'object' && data.code !== undefined) {
      console.warn("Binance API restricted, using mock data:", data.msg);
      return generateMockData(symbol, interval, limit);
    }

    // Binance API returns an array of arrays.
    // [0: open time, 1: open, 2: high, 3: low, 4: close, 5: volume, ...]
    const formattedData: KlineData[] = data.map((d: any) => ({
      time: (d[0] / 1000) as Time, // convert ms to seconds for lightweight-charts
      open: Number(d[1]),
      high: Number(d[2]),
      low: Number(d[3]),
      close: Number(d[4]),
      volume: Number(d[5]),
    }));
    return formattedData;
  } catch (error) {
    console.error("Failed to fetch Kline data:", error);
    console.log("Using mock data as fallback");
    // Return mock data instead of empty array
    return generateMockData(symbol, interval, limit);
  }
}
