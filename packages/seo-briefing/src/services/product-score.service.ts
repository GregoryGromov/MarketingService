import type { SeoBriefAiProductFit } from '../ports/seo-brief-ai.port.js';

export interface ProductScoreInput {
  fit: SeoBriefAiProductFit;
  riskCount: number;
}

export interface ProductScoreResult {
  value: number;
  baseScore: number;
  riskPenalty: number;
}

const FIT_BASE_SCORES: Record<SeoBriefAiProductFit, number> = {
  strong: 85,
  moderate: 60,
  weak: 35,
};

export class ProductScoreService {
  calculate(input: ProductScoreInput): ProductScoreResult {
    const baseScore = FIT_BASE_SCORES[input.fit];
    const riskPenalty = Math.min(Math.max(input.riskCount, 0) * 5, 20);

    return {
      value: roundScore(Math.max(baseScore - riskPenalty, 0)),
      baseScore,
      riskPenalty,
    };
  }
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}
