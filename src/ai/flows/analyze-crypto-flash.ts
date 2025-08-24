'use server';

/**
 * @fileOverview Analyzes a crypto chart using Gemini 2.5 Flash and provides trading signals.
 *
 * - analyzeCryptoFlash - A function that handles the crypto analysis process.
 * - AnalyzeCryptoFlashInput - The input type for the analyzeCryptoFlash function.
 * - AnalyzeCryptoFlashOutput - The return type for the analyzeCryptoFlash function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeCryptoFlashInputSchema = z.object({
  chartData: z.string().describe('OHLCV chart data as a string.'),
  ticker: z.string().describe('The ticker symbol of the cryptocurrency.'),
});
export type AnalyzeCryptoFlashInput = z.infer<typeof AnalyzeCryptoFlashInputSchema>;

const AnalyzeCryptoFlashOutputSchema = z.object({
  analysis: z.string().describe('Summary of the chart analysis.'),
  entryPriceRange: z.string().describe('The suggested entry price range.'),
  takeProfit: z.string().describe('The suggested take profit level.'),
  stopLoss: z.string().describe('The suggested stop loss level.'),
});
export type AnalyzeCryptoFlashOutput = z.infer<typeof AnalyzeCryptoFlashOutputSchema>;

export async function analyzeCryptoFlash(input: AnalyzeCryptoFlashInput): Promise<AnalyzeCryptoFlashOutput> {
  return analyzeCryptoFlashFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeCryptoFlashPrompt',
  input: {schema: AnalyzeCryptoFlashInputSchema},
  output: {schema: AnalyzeCryptoFlashOutputSchema},
  prompt: `You are an expert crypto trading analyst. Analyze the provided candlestick chart data and provide trading signals. Be strict and don't be creative.

Chart Data: {{{chartData}}}
Ticker: {{{ticker}}}

Provide:
1. A brief summary analysis of the chart data.
2. An entry price range.
3. A single take profit level.
4. A stop loss level.
`,
  model: 'googleai/gemini-2.5-flash',
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const analyzeCryptoFlashFlow = ai.defineFlow(
  {
    name: 'analyzeCryptoFlashFlow',
    inputSchema: AnalyzeCryptoFlashInputSchema,
    outputSchema: AnalyzeCryptoFlashOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
