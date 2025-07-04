// Type definitions for vader-sentiment
declare module 'vader-sentiment' {
  export interface SentimentResult {
    compound: number;
    pos: number;
    neg: number;
    neu: number;
  }

  export class SentimentIntensityAnalyzer {
    static polarity_scores(text: string): SentimentResult;
  }
}
