'use server';

/**
 * @fileOverview An AI agent for performing in-depth cryptocurrency analysis using Gemini Pro.
 *
 * - analyzeCryptoPro - A function that initiates the cryptocurrency analysis process.
 * - AnalyzeCryptoProInput - The input type for the analyzeCryptoPro function.
 * - AnalyzeCryptoProOutput - The return type for the analyzeCryptoPro function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeCryptoProInputSchema = z.object({
  chartDataUri: z
    .string()
    .describe(
      'A data URI containing the cryptocurrency chart image, including MIME type and Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' + 
      'The chart image should be a candlestick chart from TradingView Lightweight Charts, showcasing OHLCV data.'
    ),
  cryptoPair: z.string().describe('The cryptocurrency pair to analyze (e.g., BTC/USDT).'),
  analysisObjective: z
    .string()
    .optional()
    .describe('Any specific objective or condition for the analysis (e.g., \'identify potential breakout\').'),
});
export type AnalyzeCryptoProInput = z.infer<typeof AnalyzeCryptoProInputSchema>;

const AnalyzeCryptoProOutputSchema = z.object({
  analysisSummary: z.string().describe('A comprehensive summary of the cryptocurrency chart analysis.'),
  entryPriceRange: z.string().describe('The recommended entry price range for a potential trade.'),
  takeProfitLevels: z
    .array(z.string())
    .describe('Multiple take profit levels based on the analysis.'),
  stopLossLevel: z.string().describe('The recommended stop loss level for the trade.'),
  confidenceLevel: z
    .string()
    .optional()
    .describe('The confidence level of the analysis (e.g., High, Medium, Low).'),
});
export type AnalyzeCryptoProOutput = z.infer<typeof AnalyzeCryptoProOutputSchema>;

export async function analyzeCryptoPro(input: AnalyzeCryptoProInput): Promise<AnalyzeCryptoProOutput> {
  return analyzeCryptoProFlow(input);
}

const analyzeCryptoProPrompt = ai.definePrompt({
  name: 'analyzeCryptoProPrompt',
  input: {schema: AnalyzeCryptoProInputSchema},
  output: {schema: AnalyzeCryptoProOutputSchema},
  model: 'googleai/gemini-2.5-pro',
  prompt: `You are an expert cryptocurrency technical analyst.

  Analyze the provided candlestick chart image for the given crypto pair and provide a detailed analysis.
  The image is provided as a data URI. Extract relevant patterns, indicators, and potential trade signals.
  Based on your analysis, determine an entry price range, multiple take profit levels, and a stop loss level.
  Be very strict with randomness, and do not be creative at all. Provide an objective analysis, without guessing or assuming

  Crypto Pair: {{{cryptoPair}}}
  Analysis Objective: {{{analysisObjective}}}
  Chart Image: {{media url=chartDataUri}}

  Output your analysis in the following structured format:
  - analysisSummary: A comprehensive summary of the chart analysis.
  - entryPriceRange: The recommended entry price range for a potential trade.
  - takeProfitLevels: An array of take profit levels based on the analysis.
  - stopLossLevel: The recommended stop loss level for the trade.
  - confidenceLevel: The confidence level of the analysis (e.g., High, Medium, Low).
`,
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

const analyzeCryptoProFlow = ai.defineFlow(
  {
    name: 'analyzeCryptoProFlow',
    inputSchema: AnalyzeCryptoProInputSchema,
    outputSchema: AnalyzeCryptoProOutputSchema,
  },
  async input => {
    const {output} = await analyzeCryptoProPrompt(input);
    return output!;
  }
);
