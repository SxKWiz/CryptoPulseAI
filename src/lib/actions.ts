"use server";

import {
  analyzeCryptoFlash,
  type AnalyzeCryptoFlashInput,
  type AnalyzeCryptoFlashOutput,
} from "@/ai/flows/analyze-crypto-flash";
import {
  analyzeCryptoPro,
  type AnalyzeCryptoProInput,
  type AnalyzeCryptoProOutput,
} from "@/ai/flows/analyze-crypto-pro";
import {
  storeAnalysis,
  type StoreAnalysisInput,
} from "@/ai/flows/store-analysis";

export async function runFlashAnalysis(
  input: AnalyzeCryptoFlashInput
): Promise<AnalyzeCryptoFlashOutput> {
  try {
    const result = await analyzeCryptoFlash(input);
    
    // Store analysis result (fire-and-forget)
    storeAnalysis({
      cryptoPair: input.ticker,
      date: new Date().toISOString(),
      analysisMode: "Flash",
      entryPriceRange: result.entryPriceRange,
      takeProfit: result.takeProfit,
      stopLoss: result.stopLoss,
    });
    
    return result;
  } catch (error) {
    console.error("Flash Analysis Error:", error);
    throw new Error("Failed to perform Flash analysis. Please try again.");
  }
}

export async function runProAnalysis(
  input: AnalyzeCryptoProInput
): Promise<AnalyzeCryptoProOutput> {
  try {
    const result = await analyzeCryptoPro(input);

    // Store analysis result (fire-and-forget)
    storeAnalysis({
      cryptoPair: input.cryptoPair,
      date: new Date().toISOString(),
      analysisMode: "Pro",
      entryPriceRange: result.entryPriceRange,
      takeProfit: result.takeProfitLevels.join(", "),
      stopLoss: result.stopLossLevel,
      ultraTakeProfits: result.takeProfitLevels.join(", "),
    });

    return result;
  } catch (error) {
    console.error("Pro Analysis Error:", error);
    throw new Error("Failed to perform Pro analysis. Please try again.");
  }
}
