'use server';

/**
 * @fileOverview Stores the AI analysis results for later review.
 *
 * - storeAnalysis - A function to store the analysis.
 * - StoreAnalysisInput - The input type for the storeAnalysis function.
 * - StoreAnalysisOutput - The return type for the storeAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StoreAnalysisInputSchema = z.object({
  cryptoPair: z.string().describe('The cryptocurrency pair analyzed (e.g., BTCUSDT).'),
  date: z.string().describe('The date of the analysis in ISO format.'),
  analysisMode: z.enum(['Flash', 'Pro']).describe('The analysis mode used (Flash or Pro).'),
  entryPriceRange: z.string().describe('The entry price range suggested by the analysis.'),
  takeProfit: z.string().describe('The take profit price suggested by the analysis.'),
  stopLoss: z.string().describe('The stop loss price suggested by the analysis.'),
  ultraTakeProfits: z.string().optional().describe('The multiple take profit prices suggested by the ultra analysis.'),
});

export type StoreAnalysisInput = z.infer<typeof StoreAnalysisInputSchema>;

const StoreAnalysisOutputSchema = z.object({
  success: z.boolean().describe('Indicates whether the analysis was successfully stored.'),
  message: z.string().describe('A message indicating the status of the storage operation.'),
});

export type StoreAnalysisOutput = z.infer<typeof StoreAnalysisOutputSchema>;

export async function storeAnalysis(input: StoreAnalysisInput): Promise<StoreAnalysisOutput> {
  return storeAnalysisFlow(input);
}

const storeAnalysisFlow = ai.defineFlow(
  {
    name: 'storeAnalysisFlow',
    inputSchema: StoreAnalysisInputSchema,
    outputSchema: StoreAnalysisOutputSchema,
  },
  async input => {
    // TODO: Implement the logic to store the analysis data into Firebase.
    // For now, we'll just return a success message.
    console.log('Analysis stored:', input);
    return {
      success: true,
      message: 'Analysis stored successfully (Firebase integration pending).',
    };
  }
);
