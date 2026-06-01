export interface FinalClusterScoreInput {
  seoScore: number;
  productScore: number;
  seoWeight: number;
  productWeight: number;
  penalties: number[];
}

export interface FinalClusterScoreResult {
  value: number;
  weightedSeoScore: number;
  weightedProductScore: number;
  totalPenalty: number;
}

export class FinalClusterScoreService {
  calculate(input: FinalClusterScoreInput): FinalClusterScoreResult {
    const weightedSeoScore = input.seoScore * clampUnit(input.seoWeight);
    const weightedProductScore = input.productScore * clampUnit(input.productWeight);
    const totalPenalty = input.penalties.reduce(
      (accumulator, item) => accumulator + Math.max(item, 0),
      0,
    );

    return {
      value: roundScore(Math.max(weightedSeoScore + weightedProductScore - totalPenalty, 0)),
      weightedSeoScore: roundScore(weightedSeoScore),
      weightedProductScore: roundScore(weightedProductScore),
      totalPenalty: roundScore(totalPenalty),
    };
  }
}

function clampUnit(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  if (value >= 1) {
    return 1;
  }

  return value;
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}
