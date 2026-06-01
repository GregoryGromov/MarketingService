export interface SeoScoreInput {
  demandScore: number;
  competitionScore: number;
}

export interface SeoScoreResult {
  value: number;
}

export class SeoScoreService {
  calculate(input: SeoScoreInput): SeoScoreResult {
    return {
      value: roundScore(input.demandScore * 0.65 + input.competitionScore * 0.35),
    };
  }
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}
