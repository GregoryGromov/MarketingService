export interface DemandScoreInput {
  representativeSearchVolume: number | null;
  maxSearchVolume: number;
  clusterKeywordCount: number;
}

export interface DemandScoreResult {
  value: number;
  volumeScore: number;
  breadthScore: number;
}

export class DemandScoreService {
  calculate(input: DemandScoreInput): DemandScoreResult {
    const maxSearchVolume = input.maxSearchVolume > 0 ? input.maxSearchVolume : 1;
    const representativeSearchVolume = clampMinimum(input.representativeSearchVolume ?? 0, 0);
    const volumeScore = clampUnit(representativeSearchVolume / maxSearchVolume) * 100;
    const breadthScore = clampUnit(input.clusterKeywordCount / 5) * 100;
    const value = roundScore(volumeScore * 0.75 + breadthScore * 0.25);

    return {
      value,
      volumeScore: roundScore(volumeScore),
      breadthScore: roundScore(breadthScore),
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

function clampMinimum(value: number, minimum: number): number {
  if (!Number.isFinite(value)) {
    return minimum;
  }

  return value < minimum ? minimum : value;
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}
