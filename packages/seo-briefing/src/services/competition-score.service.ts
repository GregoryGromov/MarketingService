export interface CompetitionScoreInput {
  keywordCompetition: number | null;
  averageDomainTraffic: number | null;
  maxDomainTraffic: number;
  averageOnpageScore: number | null;
}

export interface CompetitionScoreResult {
  value: number;
  keywordEaseScore: number;
  domainEaseScore: number;
  onpageEaseScore: number;
}

export class CompetitionScoreService {
  calculate(input: CompetitionScoreInput): CompetitionScoreResult {
    const keywordEaseScore = roundScore((1 - clampUnit(input.keywordCompetition ?? 0.5)) * 100);
    const maxDomainTraffic = input.maxDomainTraffic > 0 ? input.maxDomainTraffic : 1;
    const domainEaseScore = roundScore(
      (1 - clampUnit((input.averageDomainTraffic ?? maxDomainTraffic / 2) / maxDomainTraffic)) *
        100,
    );
    const onpageEaseScore = roundScore(
      (1 - clampUnit((input.averageOnpageScore ?? 50) / 100)) * 100,
    );
    const value = roundScore(
      keywordEaseScore * 0.45 + domainEaseScore * 0.35 + onpageEaseScore * 0.2,
    );

    return {
      value,
      keywordEaseScore,
      domainEaseScore,
      onpageEaseScore,
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
