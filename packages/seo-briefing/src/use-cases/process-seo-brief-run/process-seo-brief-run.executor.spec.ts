import { describe, expect, it } from 'vitest';
import {
  type BuildProductBridgeParams,
  type BuildProductBridgeResult,
  type ClusterKeywordsParams,
  type ClusterKeywordsResult,
  type ExpandKeywordsParams,
  type ExpandKeywordsResult,
  type ExplainClusterSelectionParams,
  type ExplainClusterSelectionResult,
  type GenerateSeoBriefParams,
  type GenerateSeoBriefResult,
  type GetDomainMetricsParams,
  type GetKeywordSuggestionsParams,
  type GetOnPageParseParams,
  type GetOrganicSerpParams,
  type GetSearchVolumeParams,
  type SelectRelatedKeywordsParams,
  type SelectRelatedKeywordsResult,
  SeoBriefAiPort,
  SeoBriefArtifact,
  SeoBriefDocument,
  SeoBriefRun,
  SeoResearchPort,
  type TriageKeywordsParams,
  type TriageKeywordsResult,
} from '../../index.js';
import { SeoBriefScoreLoggerService } from '../../services/seo-brief-score-logger.service.js';
import { InMemorySeoBriefScoreLogRepository } from '../../testing/logging-test-harness.js';
import {
  InMemorySeoBriefArtifactRepository,
  InMemorySeoBriefDocumentRepository,
  InMemorySeoBriefRunRepository,
  InMemorySeoBriefRunStepRepository,
} from '../../testing/run-test-harness.js';
import { ProcessSeoBriefRunExecutor } from './process-seo-brief-run.executor.js';

class FakeSeoBriefAiPort extends SeoBriefAiPort {
  expandKeywordCalls: ExpandKeywordsParams[] = [];
  buildProductBridgeCalls: BuildProductBridgeParams[] = [];
  generateSeoBriefCalls: GenerateSeoBriefParams[] = [];
  expandKeywordsResult: ExpandKeywordsResult = {
    hypotheses: [
      {
        keyword: 'usdt passive income',
        intent: 'informational',
        rationale: 'Strong match for the topic seed.',
        audienceFit: 'Fits beginner search intent.',
      },
      {
        keyword: 'best way to earn with usdt',
        intent: 'commercial',
        rationale: 'Captures solution-seeking intent.',
        audienceFit: 'Still relevant for entry-level users.',
      },
    ],
  };

  async expandKeywords(params: ExpandKeywordsParams): Promise<ExpandKeywordsResult> {
    this.expandKeywordCalls.push(params);

    return this.expandKeywordsResult;
  }

  triageKeywords(_params: TriageKeywordsParams): Promise<TriageKeywordsResult> {
    return Promise.resolve({
      accepted: [
        {
          keyword: 'usdt passive income',
          intent: 'informational',
          stage: 'awareness',
          reason: 'Strong educational query.',
        },
        {
          keyword: 'best way to earn with usdt',
          intent: 'commercial',
          stage: 'consideration',
          reason: 'Good solution-seeking query.',
        },
        {
          keyword: 'usdt passive income guide',
          intent: 'informational',
          stage: 'awareness',
          reason: 'Related demand expansion.',
        },
      ],
      rejected: [
        {
          keyword: 'buy bitcoin',
          reason: 'Too far from the topic seed.',
        },
      ],
    });
  }

  clusterKeywords(_params: ClusterKeywordsParams): Promise<ClusterKeywordsResult> {
    return Promise.resolve({
      clusters: [
        {
          label: 'USDT passive income basics',
          primaryKeyword: 'usdt passive income',
          intent: 'informational',
          keywords: ['usdt passive income', 'usdt passive income guide'],
          rationale: 'Beginner education cluster.',
        },
        {
          label: 'Best ways to earn with USDT',
          primaryKeyword: 'best way to earn with usdt',
          intent: 'commercial',
          keywords: ['best way to earn with usdt'],
          rationale: 'Commercial comparison cluster.',
        },
      ],
    });
  }

  selectRelatedKeywords(
    _params: SelectRelatedKeywordsParams,
  ): Promise<SelectRelatedKeywordsResult> {
    return Promise.resolve({
      selected: [],
      rejected: [],
    });
  }

  buildProductBridge(params: BuildProductBridgeParams): Promise<BuildProductBridgeResult> {
    this.buildProductBridgeCalls.push(params);

    if (params.clusterLabel === 'USDT passive income basics') {
      return Promise.resolve({
        fit: 'strong',
        summary: 'Reinforce can be introduced after educational framing.',
        positioningAngle: 'Education-first bridge',
        cta: 'See how Reinforce works',
        talkingPoints: ['Idle USDT', 'Risk awareness'],
        risks: ['Do not promise guaranteed returns'],
      });
    }

    return Promise.resolve({
      fit: 'moderate',
      summary: 'Reinforce can be one option among several.',
      positioningAngle: 'Comparison bridge',
      cta: 'Compare Reinforce',
      talkingPoints: ['Option comparison'],
      risks: ['Avoid overstating product superiority', 'Avoid guaranteed returns'],
    });
  }

  explainClusterSelection(
    params: ExplainClusterSelectionParams,
  ): Promise<ExplainClusterSelectionResult> {
    return Promise.resolve({
      summary: `${params.selectedClusterLabel} had the best overall balance.`,
      reasons: ['Higher demand', 'Cleaner product bridge'],
      rejectedClusters: params.candidates
        .filter((item) => item.label !== params.selectedClusterLabel)
        .map((item) => ({
          label: item.label,
          reason: 'Lower combined score than the selected cluster',
        })),
    });
  }

  generateSeoBrief(_params: GenerateSeoBriefParams): Promise<GenerateSeoBriefResult> {
    this.generateSeoBriefCalls.push(_params);

    return Promise.resolve({
      title: 'How to Earn with USDT Safely',
      metaTitle: 'How to Earn with USDT Safely | Beginner Guide',
      metaDescription: 'Learn practical, risk-aware ways to make idle USDT productive.',
      angle: 'Teach the basics first, then introduce Reinforce as a next step.',
      outline: [
        {
          heading: 'What earning with USDT actually means',
          purpose: 'Set the foundation for a beginner reader.',
          keyPoints: ['Explain common options', 'Set risk expectations'],
        },
      ],
      faq: [
        {
          question: 'Is earning with USDT risk-free?',
          answer: 'No, each option comes with different tradeoffs and risks.',
        },
      ],
      productPlacement: {
        summary: 'Introduce Reinforce after the educational sections.',
        cta: 'See how Reinforce works',
        sections: ['Conclusion'],
      },
    });
  }
}

class FakeSeoResearchPort extends SeoResearchPort {
  searchVolumeCalls: GetSearchVolumeParams[] = [];
  keywordSuggestionCalls: GetKeywordSuggestionsParams[] = [];
  organicSerpCalls: GetOrganicSerpParams[] = [];
  domainMetricsCalls: GetDomainMetricsParams[] = [];
  onPageParseCalls: GetOnPageParseParams[] = [];

  async getSearchVolume(params: GetSearchVolumeParams) {
    this.searchVolumeCalls.push(params);

    return {
      provider: 'dataforseo' as const,
      market: params.market,
      items: [
        {
          keyword: 'usdt passive income',
          searchVolume: 5400,
          competition: 0.31,
          cpc: 1.2,
          lowTopBid: 0.8,
          highTopBid: 1.6,
          monthlySearches: [],
        },
        {
          keyword: 'best way to earn with usdt',
          searchVolume: 3200,
          competition: 0.41,
          cpc: 1.4,
          lowTopBid: 0.9,
          highTopBid: 1.7,
          monthlySearches: [],
        },
      ],
    };
  }

  async getKeywordSuggestions(params: GetKeywordSuggestionsParams) {
    this.keywordSuggestionCalls.push(params);

    return {
      provider: 'dataforseo' as const,
      seedKeyword: params.keyword,
      market: params.market,
      items: [
        {
          keyword: `${params.keyword} guide`,
          searchVolume: 1000,
          competition: 0.2,
          cpc: 0.8,
          relevance: 0.9,
        },
        {
          keyword: `${params.keyword} for beginners`,
          searchVolume: 800,
          competition: 0.18,
          cpc: 0.7,
          relevance: 0.85,
        },
      ],
    };
  }

  async getOrganicSerp(params: GetOrganicSerpParams) {
    this.organicSerpCalls.push(params);

    return {
      provider: 'dataforseo' as const,
      keyword: params.keyword,
      market: params.market,
      checkUrl: `https://google.com/search?q=${encodeURIComponent(params.keyword)}`,
      totalCount: 1000,
      items: [
        {
          type: 'organic',
          rankGroup: 1,
          rankAbsolute: 1,
          title: `${params.keyword} guide`,
          url: `https://example.com/${slugify(params.keyword)}`,
          domain: 'example.com',
          description: `Overview for ${params.keyword}`,
        },
        {
          type: 'organic',
          rankGroup: 2,
          rankAbsolute: 2,
          title: `${params.keyword} comparison`,
          url: `https://competitor.com/${slugify(params.keyword)}`,
          domain: 'competitor.com',
          description: `Comparison page for ${params.keyword}`,
        },
      ],
    };
  }

  async getOrganicSerpSnapshot(params: GetOrganicSerpParams) {
    const result = await this.getOrganicSerp(params);

    return {
      provider: 'dataforseo' as const,
      rawResponse: {
        tasks: [],
      },
      snapshot: {
        keyword: result.keyword,
        locationName: params.market.locationName ?? params.market.country,
        languageName: params.market.language,
        device: params.device ?? 'desktop',
        os: 'android',
        serpFeatures: ['organic'],
        organicResults: result.items
          .filter((item) => item.type === 'organic' && item.domain && item.url)
          .map((item, index) => ({
            position: item.rankGroup ?? item.rankAbsolute ?? index + 1,
            rankGroup: item.rankGroup,
            rankAbsolute: item.rankAbsolute,
            domain: item.domain ?? '',
            url: item.url ?? '',
            title: item.title,
            snippet: item.description,
          })),
        peopleAlsoAsk: [],
        relatedSearches: [],
        specialBlocks: [],
      },
    };
  }

  async getDomainMetrics(params: GetDomainMetricsParams) {
    this.domainMetricsCalls.push(params);

    return {
      provider: 'dataforseo' as const,
      market: params.market,
      target: params.target,
      organicKeywords: 1200,
      organicTraffic: 5500,
      organicTrafficCost: 2100,
      paidKeywords: 15,
      paidTraffic: 120,
      paidTrafficCost: 90,
    };
  }

  async getOnPageParse(params: GetOnPageParseParams) {
    this.onPageParseCalls.push(params);

    return {
      provider: 'dataforseo' as const,
      providerTaskId: `task-${slugify(params.target)}`,
      target: params.target,
      crawlProgress: 'finished',
      onpageScore: 78,
      pageCount: 1,
      brokenPages: 0,
      duplicateTitlePages: 0,
      duplicateDescriptionPages: 1,
    };
  }
}

describe('ProcessSeoBriefRunExecutor', () => {
  it('can stop after keyword expansion and wait for manual confirmation', async () => {
    const runRepository = new InMemorySeoBriefRunRepository();
    const stepRepository = new InMemorySeoBriefRunStepRepository();
    const artifactRepository = new InMemorySeoBriefArtifactRepository();
    const documentRepository = new InMemorySeoBriefDocumentRepository();
    const scoreLogRepository = new InMemorySeoBriefScoreLogRepository();
    const ai = new FakeSeoBriefAiPort();
    const seoResearch = new FakeSeoResearchPort();

    const run = createQueuedRun();
    await runRepository.save(run);
    await artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id,
        stage: 'created',
        artifactType: 'normalized_input',
        payload: {
          keywordExpansionPrompt: 'Use short, general head terms only.',
        },
      }),
    );

    const executor = new ProcessSeoBriefRunExecutor(
      runRepository,
      stepRepository,
      artifactRepository,
      documentRepository,
      ai,
      seoResearch,
      new SeoBriefScoreLoggerService(scoreLogRepository),
    );

    const result = await executor.execute(run.id, {
      startStage: 'keyword_expansion',
      stopAfterStage: 'keyword_expansion',
    });
    const storedRun = await runRepository.findById(run.id);
    const steps = await stepRepository.findByRunId(run.id);
    const artifacts = await artifactRepository.findByRunId(run.id);

    expect(result.status).toBe('awaiting_confirmation');
    expect(result.hypothesisCount).toBe(2);
    expect(result.keywordCount).toBe(0);
    expect(ai.expandKeywordCalls[0]?.keywordExpansionPrompt).toBe(
      'Use short, general head terms only.',
    );
    expect(storedRun?.status).toBe('awaiting_confirmation');
    expect(steps.map((step) => [step.stage, step.status])).toEqual([
      ['keyword_expansion', 'completed'],
    ]);
    expect(seoResearch.searchVolumeCalls).toHaveLength(0);
    expect(
      artifacts.find((artifact) => artifact.artifactType === 'keyword_hypotheses')?.payload,
    ).toMatchObject({
      hypotheses: [{ keyword: 'usdt passive income' }, { keyword: 'best way to earn with usdt' }],
    });
  });

  it('caps keyword hypotheses at the configured expansion limit even when AI returns more', async () => {
    const runRepository = new InMemorySeoBriefRunRepository();
    const stepRepository = new InMemorySeoBriefRunStepRepository();
    const artifactRepository = new InMemorySeoBriefArtifactRepository();
    const documentRepository = new InMemorySeoBriefDocumentRepository();
    const scoreLogRepository = new InMemorySeoBriefScoreLogRepository();
    const ai = new FakeSeoBriefAiPort();
    ai.expandKeywordsResult = {
      hypotheses: Array.from({ length: 10 }, (_, index) => ({
        keyword: `keyword ${index + 1}`,
        intent: 'informational',
        rationale: 'AI returned too many candidates.',
        audienceFit: 'Test candidate.',
      })),
    };
    const seoResearch = new FakeSeoResearchPort();
    const run = createQueuedRun();
    await runRepository.save(run);
    const executor = new ProcessSeoBriefRunExecutor(
      runRepository,
      stepRepository,
      artifactRepository,
      documentRepository,
      ai,
      seoResearch,
      new SeoBriefScoreLoggerService(scoreLogRepository),
    );

    const result = await executor.execute(run.id, {
      startStage: 'keyword_expansion',
      stopAfterStage: 'keyword_expansion',
    });
    const artifacts = await artifactRepository.findByRunId(run.id);
    const keywordHypotheses = artifacts.find(
      (artifact) => artifact.artifactType === 'keyword_hypotheses',
    )?.payload as { hypotheses?: Array<{ keyword: string }> } | undefined;

    expect(result.hypothesisCount).toBe(3);
    expect(keywordHypotheses?.hypotheses).toHaveLength(3);
    expect(keywordHypotheses?.hypotheses?.map((item) => item.keyword)).toEqual([
      'keyword 1',
      'keyword 2',
      'keyword 3',
    ]);
  });

  it('processes research, triage, clustering, scoring, and selection with score logs', async () => {
    const runRepository = new InMemorySeoBriefRunRepository();
    const stepRepository = new InMemorySeoBriefRunStepRepository();
    const artifactRepository = new InMemorySeoBriefArtifactRepository();
    const documentRepository = new InMemorySeoBriefDocumentRepository();
    const scoreLogRepository = new InMemorySeoBriefScoreLogRepository();
    const ai = new FakeSeoBriefAiPort();
    const seoResearch = new FakeSeoResearchPort();

    const run = SeoBriefRun.create({
      topicSeed: 'how to earn with USDT',
      country: 'Nigeria',
      language: 'English',
      audience: 'Beginners',
      productName: 'Reinforce',
      productDescription: 'Helps users make idle USDT productive',
      brandMemorySnapshot: {
        brandName: 'Reinforce',
        productDescription: 'Helps users make idle USDT productive',
        targetAudience: 'Beginners',
        approvedFacts: [],
        forbiddenClaims: [],
        glossary: {},
        bannedPhrases: [],
        requiredPhrases: [],
        brandDocs: [],
        adaptationPromptRules: null,
      },
    });
    run.queue();
    await runRepository.save(run);

    const executor = new ProcessSeoBriefRunExecutor(
      runRepository,
      stepRepository,
      artifactRepository,
      documentRepository,
      ai,
      seoResearch,
      new SeoBriefScoreLoggerService(scoreLogRepository),
    );

    const result = await executor.execute(run.id);
    const storedRun = await runRepository.findById(run.id);
    const steps = await stepRepository.findByRunId(run.id);
    const artifacts = await artifactRepository.findByRunId(run.id);
    const briefDocument = await documentRepository.findLatestByRunId(run.id);
    const scoreLogs = await scoreLogRepository.findByRunId(run.id);

    expect(result.status).toBe('done');
    expect(result.hypothesisCount).toBe(2);
    expect(result.keywordCount).toBe(3);
    expect(result.relatedSeedCount).toBe(3);
    expect(result.relatedKeywordCount).toBe(6);
    expect(result.serpKeywordCount).toBe(3);
    expect(result.domainCount).toBe(2);
    expect(result.onpageTargetCount).toBe(3);
    expect(result.acceptedKeywordCount).toBe(3);
    expect(result.clusterCount).toBe(2);
    expect(result.selectedClusterLabel).toBe('USDT passive income basics');
    expect(result.briefDocumentId).toBe(briefDocument?.id ?? null);
    expect(result.briefTitle).toBe('How to Earn with USDT Safely');
    expect(storedRun?.status).toBe('done');
    expect(ai.expandKeywordCalls).toHaveLength(1);
    expect(seoResearch.searchVolumeCalls).toHaveLength(1);
    expect(seoResearch.keywordSuggestionCalls).toHaveLength(3);
    expect(seoResearch.organicSerpCalls).toHaveLength(3);
    expect(seoResearch.domainMetricsCalls).toHaveLength(2);
    expect(seoResearch.onPageParseCalls).toHaveLength(3);
    expect(steps.map((step) => [step.stage, step.status])).toEqual([
      ['keyword_expansion', 'completed'],
      ['keyword_research', 'completed'],
      ['related_keyword_research', 'completed'],
      ['serp_research', 'completed'],
      ['domain_metrics_research', 'completed'],
      ['onpage_research', 'completed'],
      ['keyword_triage', 'completed'],
      ['clustering', 'completed'],
      ['cluster_scoring', 'completed'],
      ['cluster_selection', 'completed'],
      ['brief_generation', 'completed'],
    ]);
    expect(scoreLogs).toHaveLength(10);
    expect(briefDocument).toBeInstanceOf(SeoBriefDocument);
    expect(briefDocument?.briefPayload).toMatchObject({
      title: 'How to Earn with USDT Safely',
      metaTitle: 'How to Earn with USDT Safely | Beginner Guide',
      primaryKeyword: 'usdt passive income',
    });

    const keywordHypotheses = artifacts.find(
      (artifact) => artifact.artifactType === 'keyword_hypotheses',
    );
    const keywordResearch = artifacts.find(
      (artifact) => artifact.artifactType === 'keyword_research_snapshot',
    );
    const relatedResearch = artifacts.find(
      (artifact) => artifact.artifactType === 'related_keyword_research_snapshot',
    );
    const serpResearch = artifacts.find(
      (artifact) => artifact.artifactType === 'serp_research_snapshot',
    );
    const domainMetrics = artifacts.find(
      (artifact) => artifact.artifactType === 'domain_metrics_snapshot',
    );
    const onpageResearch = artifacts.find(
      (artifact) => artifact.artifactType === 'onpage_research_snapshot',
    );
    const triageSnapshot = artifacts.find(
      (artifact) => artifact.artifactType === 'keyword_triage_snapshot',
    );
    const clusterSnapshot = artifacts.find(
      (artifact) => artifact.artifactType === 'cluster_snapshot',
    );
    const clusterScoringSnapshot = artifacts.find(
      (artifact) => artifact.artifactType === 'cluster_scoring_snapshot',
    );
    const clusterSelectionSnapshot = artifacts.find(
      (artifact) => artifact.artifactType === 'cluster_selection_snapshot',
    );
    const finalBriefSnapshot = artifacts.find(
      (artifact) => artifact.artifactType === 'final_brief_snapshot',
    );
    const evidencePackSnapshot = artifacts.find(
      (artifact) => artifact.artifactType === 'evidence_pack_snapshot',
    );
    const researchV1Summary = artifacts.find(
      (artifact) => artifact.artifactType === 'research_v1_summary',
    );
    const researchV2Summary = artifacts.find(
      (artifact) => artifact.artifactType === 'research_v2_summary',
    );

    expect(keywordHypotheses?.stage).toBe('keyword_expansion');
    expect(keywordResearch?.stage).toBe('keyword_research');
    expect(relatedResearch?.stage).toBe('related_keyword_research');
    expect(serpResearch?.stage).toBe('serp_research');
    expect(domainMetrics?.stage).toBe('domain_metrics_research');
    expect(onpageResearch?.stage).toBe('onpage_research');
    expect(triageSnapshot?.stage).toBe('keyword_triage');
    expect(clusterSnapshot?.stage).toBe('clustering');
    expect(clusterScoringSnapshot?.stage).toBe('cluster_scoring');
    expect(clusterSelectionSnapshot?.stage).toBe('cluster_selection');
    expect(finalBriefSnapshot?.stage).toBe('brief_generation');
    expect(evidencePackSnapshot?.stage).toBe('brief_generation');
    expect(researchV1Summary?.payload).toEqual({
      hypothesisCount: 2,
      keywordCount: 3,
      relatedSeedCount: 3,
      relatedKeywordCount: 6,
    });
    expect(researchV2Summary?.payload).toEqual({
      hypothesisCount: 2,
      keywordCount: 3,
      relatedSeedCount: 3,
      relatedKeywordCount: 6,
      serpKeywordCount: 3,
      serpResultCount: 6,
      domainCount: 2,
      onpageTargetCount: 3,
    });
    expect(finalBriefSnapshot?.payload).toMatchObject({
      brief: {
        title: 'How to Earn with USDT Safely',
      },
      selectedCluster: {
        label: 'USDT passive income basics',
      },
    });
    expect(evidencePackSnapshot?.payload).toMatchObject({
      topicSeed: 'how to earn with USDT',
      selectedCluster: {
        label: 'USDT passive income basics',
      },
      researchSummary: {
        domainCount: 2,
        onpageTargetCount: 3,
      },
    });
    expect(scoreLogs.some((item) => item.formulaName === 'final_cluster_score')).toBe(true);
  });

  it('marks the run as rejected when triage removes all keywords', async () => {
    class RejectingSeoBriefAiPort extends FakeSeoBriefAiPort {
      override triageKeywords(_params: TriageKeywordsParams): Promise<TriageKeywordsResult> {
        return Promise.resolve({
          accepted: [],
          rejected: [
            {
              keyword: 'usdt passive income',
              reason: 'Insufficient commercial relevance',
            },
          ],
        });
      }
    }

    const runRepository = new InMemorySeoBriefRunRepository();
    const stepRepository = new InMemorySeoBriefRunStepRepository();
    const artifactRepository = new InMemorySeoBriefArtifactRepository();
    const documentRepository = new InMemorySeoBriefDocumentRepository();
    const scoreLogRepository = new InMemorySeoBriefScoreLogRepository();
    const ai = new RejectingSeoBriefAiPort();
    const seoResearch = new FakeSeoResearchPort();

    const run = createQueuedRun();
    await runRepository.save(run);

    const executor = new ProcessSeoBriefRunExecutor(
      runRepository,
      stepRepository,
      artifactRepository,
      documentRepository,
      ai,
      seoResearch,
      new SeoBriefScoreLoggerService(scoreLogRepository),
    );

    const result = await executor.execute(run.id);
    const storedRun = await runRepository.findById(run.id);
    const steps = await stepRepository.findByRunId(run.id);
    const artifacts = await artifactRepository.findByRunId(run.id);
    const briefDocument = await documentRepository.findLatestByRunId(run.id);
    const scoreLogs = await scoreLogRepository.findByRunId(run.id);

    expect(result.status).toBe('rejected');
    expect(result.acceptedKeywordCount).toBe(0);
    expect(result.clusterCount).toBe(0);
    expect(result.selectedClusterLabel).toBeNull();
    expect(result.briefDocumentId).toBeNull();
    expect(result.briefTitle).toBeNull();
    expect(storedRun?.status).toBe('rejected');
    expect(steps.map((step) => [step.stage, step.status, step.errorMessage ?? null])).toEqual([
      ['keyword_expansion', 'completed', null],
      ['keyword_research', 'completed', null],
      ['related_keyword_research', 'completed', null],
      ['serp_research', 'completed', null],
      ['domain_metrics_research', 'completed', null],
      ['onpage_research', 'completed', null],
      ['keyword_triage', 'completed', null],
    ]);
    expect(artifacts.some((artifact) => artifact.artifactType === 'keyword_triage_snapshot')).toBe(
      true,
    );
    expect(artifacts.some((artifact) => artifact.artifactType === 'cluster_snapshot')).toBe(false);
    expect(briefDocument).toBeNull();
    expect(scoreLogs).toHaveLength(0);
  });

  it('marks the run as needs_manual_review when the best cluster has weak product fit', async () => {
    class LowFitSeoBriefAiPort extends FakeSeoBriefAiPort {
      override buildProductBridge(
        _params: BuildProductBridgeParams,
      ): Promise<BuildProductBridgeResult> {
        return Promise.resolve({
          fit: 'weak',
          summary: 'Bridge is too weak to proceed automatically.',
          positioningAngle: 'Avoid hard sell',
          cta: 'Review manually',
          talkingPoints: ['Explain limitations first'],
          risks: ['Weak fit', 'Low trust', 'High compliance risk'],
        });
      }
    }

    const runRepository = new InMemorySeoBriefRunRepository();
    const stepRepository = new InMemorySeoBriefRunStepRepository();
    const artifactRepository = new InMemorySeoBriefArtifactRepository();
    const documentRepository = new InMemorySeoBriefDocumentRepository();
    const scoreLogRepository = new InMemorySeoBriefScoreLogRepository();
    const ai = new LowFitSeoBriefAiPort();
    const seoResearch = new FakeSeoResearchPort();

    const run = createQueuedRun();
    await runRepository.save(run);

    const executor = new ProcessSeoBriefRunExecutor(
      runRepository,
      stepRepository,
      artifactRepository,
      documentRepository,
      ai,
      seoResearch,
      new SeoBriefScoreLoggerService(scoreLogRepository),
    );

    const result = await executor.execute(run.id);
    const storedRun = await runRepository.findById(run.id);
    const steps = await stepRepository.findByRunId(run.id);
    const artifacts = await artifactRepository.findByRunId(run.id);
    const briefDocument = await documentRepository.findLatestByRunId(run.id);
    const scoreLogs = await scoreLogRepository.findByRunId(run.id);
    const clusterSelectionSnapshot = artifacts.find(
      (artifact) => artifact.artifactType === 'cluster_selection_snapshot',
    );

    expect(result.status).toBe('needs_manual_review');
    expect(result.acceptedKeywordCount).toBe(3);
    expect(result.clusterCount).toBe(2);
    expect(result.selectedClusterLabel).toBe('USDT passive income basics');
    expect(result.briefDocumentId).toBeNull();
    expect(result.briefTitle).toBeNull();
    expect(storedRun?.status).toBe('needs_manual_review');
    expect(steps.map((step) => [step.stage, step.status])).toEqual([
      ['keyword_expansion', 'completed'],
      ['keyword_research', 'completed'],
      ['related_keyword_research', 'completed'],
      ['serp_research', 'completed'],
      ['domain_metrics_research', 'completed'],
      ['onpage_research', 'completed'],
      ['keyword_triage', 'completed'],
      ['clustering', 'completed'],
      ['cluster_scoring', 'completed'],
      ['cluster_selection', 'completed'],
    ]);
    expect(scoreLogs).toHaveLength(10);
    expect(briefDocument).toBeNull();
    expect(clusterSelectionSnapshot?.payload).toMatchObject({
      outcome: 'needs_manual_review',
      reason: 'Top cluster has insufficient product fit',
    });
  });

  it('can rerun from cluster_scoring without repeating research stages', async () => {
    const runRepository = new InMemorySeoBriefRunRepository();
    const stepRepository = new InMemorySeoBriefRunStepRepository();
    const artifactRepository = new InMemorySeoBriefArtifactRepository();
    const documentRepository = new InMemorySeoBriefDocumentRepository();
    const scoreLogRepository = new InMemorySeoBriefScoreLogRepository();
    const ai = new FakeSeoBriefAiPort();
    const seoResearch = new FakeSeoResearchPort();

    const run = createQueuedRun();
    await runRepository.save(run);

    const executor = new ProcessSeoBriefRunExecutor(
      runRepository,
      stepRepository,
      artifactRepository,
      documentRepository,
      ai,
      seoResearch,
      new SeoBriefScoreLoggerService(scoreLogRepository),
    );

    await executor.execute(run.id);

    const storedRun = await runRepository.findById(run.id);
    storedRun?.setSeoProductBalance({
      seoWeight: 0.2,
      productWeight: 0.8,
    });
    if (storedRun) {
      await runRepository.save(storedRun);
    }

    const result = await executor.execute(run.id, {
      startStage: 'cluster_scoring',
    });
    const steps = await stepRepository.findByRunId(run.id);
    const artifacts = await artifactRepository.findByRunId(run.id);
    const scoreLogs = await scoreLogRepository.findByRunId(run.id);

    expect(result.status).toBe('done');
    expect(result.briefTitle).toBe('How to Earn with USDT Safely');
    expect(seoResearch.searchVolumeCalls).toHaveLength(1);
    expect(seoResearch.keywordSuggestionCalls).toHaveLength(3);
    expect(seoResearch.organicSerpCalls).toHaveLength(3);
    expect(seoResearch.domainMetricsCalls).toHaveLength(2);
    expect(seoResearch.onPageParseCalls).toHaveLength(3);
    expect(ai.buildProductBridgeCalls).toHaveLength(4);
    expect(ai.generateSeoBriefCalls).toHaveLength(2);
    expect(
      steps
        .filter((step) =>
          ['cluster_scoring', 'cluster_selection', 'brief_generation'].includes(step.stage),
        )
        .map((step) => [step.stage, step.attemptNumber, step.status]),
    ).toEqual([
      ['cluster_scoring', 1, 'completed'],
      ['cluster_selection', 1, 'completed'],
      ['brief_generation', 1, 'completed'],
      ['cluster_scoring', 2, 'completed'],
      ['cluster_selection', 2, 'completed'],
      ['brief_generation', 2, 'completed'],
    ]);
    expect(
      artifacts
        .filter((artifact) =>
          [
            'cluster_scoring_snapshot',
            'cluster_selection_snapshot',
            'final_brief_snapshot',
          ].includes(artifact.artifactType),
        )
        .map((artifact) => [artifact.artifactType, artifact.attempt]),
    ).toEqual([
      ['cluster_scoring_snapshot', 1],
      ['cluster_selection_snapshot', 1],
      ['final_brief_snapshot', 1],
      ['cluster_scoring_snapshot', 2],
      ['cluster_selection_snapshot', 2],
      ['final_brief_snapshot', 2],
    ]);
    expect(scoreLogs).toHaveLength(20);
  });
});

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
}

function createQueuedRun(): SeoBriefRun {
  const run = SeoBriefRun.create({
    topicSeed: 'how to earn with USDT',
    country: 'Nigeria',
    language: 'English',
    audience: 'Beginners',
    productName: 'Reinforce',
    productDescription: 'Helps users make idle USDT productive',
    brandMemorySnapshot: {
      brandName: 'Reinforce',
      productDescription: 'Helps users make idle USDT productive',
      targetAudience: 'Beginners',
      approvedFacts: [],
      forbiddenClaims: [],
      glossary: {},
      bannedPhrases: [],
      requiredPhrases: [],
      brandDocs: [],
      adaptationPromptRules: null,
    },
  });
  run.queue();
  return run;
}
