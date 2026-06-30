import { describe, expect, it } from 'vitest';
import { CompetitionScoreService } from './competition-score.service.js';
import { DemandScoreService } from './demand-score.service.js';
import { FinalClusterScoreService } from './final-cluster-score.service.js';
import { ProductScoreService } from './product-score.service.js';
import { SeoScoreService } from './seo-score.service.js';

describe('SEO cluster scoring services', () => {
  it('calculates deterministic cluster score chain', () => {
    const demand = new DemandScoreService().calculate({
      representativeSearchVolume: 5400,
      maxSearchVolume: 5400,
      clusterKeywordCount: 3,
    });
    const competition = new CompetitionScoreService().calculate({
      keywordCompetition: 0.31,
      averageDomainTraffic: 5500,
      maxDomainTraffic: 5500,
      averageOnpageScore: 78,
    });
    const seo = new SeoScoreService().calculate({
      demandScore: demand.value,
      competitionScore: competition.value,
    });
    const product = new ProductScoreService().calculate({
      fit: 'strong',
      riskCount: 2,
    });
    const finalScore = new FinalClusterScoreService().calculate({
      seoScore: seo.value,
      productScore: product.value,
      seoWeight: 0.6,
      productWeight: 0.4,
      penalties: [5],
    });

    expect(demand.value).toBeGreaterThan(80);
    expect(competition.value).toBeGreaterThan(20);
    expect(seo.value).toBeGreaterThan(50);
    expect(product.value).toBe(75);
    expect(finalScore.value).toBeGreaterThan(40);
  });

  it('shifts final preference when product weight dominates SEO weight', () => {
    const finalScoreService = new FinalClusterScoreService();

    const seoHeavy = finalScoreService.calculate({
      seoScore: 82,
      productScore: 45,
      seoWeight: 0.8,
      productWeight: 0.2,
      penalties: [],
    });
    const productHeavy = finalScoreService.calculate({
      seoScore: 82,
      productScore: 45,
      seoWeight: 0.2,
      productWeight: 0.8,
      penalties: [],
    });

    expect(seoHeavy.value).toBeGreaterThan(productHeavy.value);
  });
});
