import type {
  BuildProductBridgeParams,
  ClassifySerpDomainsParams,
  ClusterKeywordsParams,
  ExpandKeywordsParams,
  ExplainClusterSelectionParams,
  GenerateSeoBriefParams,
  ReviewClusterProductFitParams,
  SelectRelatedKeywordsParams,
  SeoBriefArtifactRepository,
  SeoBriefLlmCallLog,
  SeoBriefLlmCallLogId,
  SeoBriefLlmLogRepository,
  SeoBriefRunId,
  TriageKeywordsParams,
} from '@marketing-service/seo-briefing';
import type { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import { DeepSeekSeoBriefAiAdapter } from './deepseek-seo-brief-ai.adapter.js';
import { SEO_BRIEF_AI_PROMPT_VERSIONS } from './deepseek-seo-brief-ai.prompts.js';
import {
  type SeoBriefAiCompletionRequest,
  type SeoBriefAiCompletionResponse,
  SeoBriefAiHttpClientPort,
} from './seo-brief-ai-http-client.port.js';

class InMemorySeoBriefLlmLogRepository {
  readonly records = new Map<string, SeoBriefLlmCallLog>();

  findById(id: SeoBriefLlmCallLogId): Promise<SeoBriefLlmCallLog | null> {
    return Promise.resolve(this.records.get(id) ?? null);
  }

  findByRunId(runId: SeoBriefRunId): Promise<SeoBriefLlmCallLog[]> {
    return Promise.resolve([...this.records.values()].filter((record) => record.runId === runId));
  }

  save(log: SeoBriefLlmCallLog): Promise<void> {
    this.records.set(log.id, log);
    return Promise.resolve();
  }
}

class FakeSeoBriefArtifactRepository {
  constructor(private readonly pricing: { input: number; output: number } | null = null) {}

  findByRunId(): Promise<Array<{ artifactType: string; payload: Record<string, unknown> }>> {
    return Promise.resolve(
      this.pricing
        ? [
            {
              artifactType: 'normalized_input',
              payload: {
                deepSeekPricing: {
                  inputUsdPerMillionTokens: this.pricing.input,
                  outputUsdPerMillionTokens: this.pricing.output,
                },
              },
            },
          ]
        : [],
    );
  }

  save(): Promise<void> {
    return Promise.resolve();
  }
}

class FakeConfigService {
  constructor(private readonly values: Record<string, string>) {}

  get<T = string>(key: string): T | undefined {
    return this.values[key] as T | undefined;
  }
}

class FakeSeoBriefAiHttpClient extends SeoBriefAiHttpClientPort {
  readonly requests: SeoBriefAiCompletionRequest[] = [];

  constructor(private readonly queue: SeoBriefAiCompletionResponse[]) {
    super();
  }

  async requestCompletion(
    request: SeoBriefAiCompletionRequest,
  ): Promise<SeoBriefAiCompletionResponse> {
    this.requests.push(request);
    const next = this.queue.shift();
    if (!next) {
      throw new Error('No queued fake SEO brief AI response');
    }

    return next;
  }
}

function createAdapter(
  queue: SeoBriefAiCompletionResponse[],
  pricing: { input: number; output: number } | null = null,
) {
  const client = new FakeSeoBriefAiHttpClient(queue);
  const repository = new InMemorySeoBriefLlmLogRepository();
  const artifactRepository = new FakeSeoBriefArtifactRepository(pricing);
  const adapter = new DeepSeekSeoBriefAiAdapter(
    new FakeConfigService({
      SEO_BRIEF_AI_MAX_ATTEMPTS: '2',
      SEO_BRIEF_AI_RETRY_DELAY_MS: '0',
      SEO_BRIEF_AI_STRUCTURED_REPAIR_ATTEMPTS: '1',
      SEO_BRIEF_AI_TIMEOUT_MS: '1000',
      SEO_BRIEF_AI_MODEL: 'deepseek-v4-pro',
    }) as unknown as ConfigService,
    client,
    repository as SeoBriefLlmLogRepository,
    artifactRepository as unknown as SeoBriefArtifactRepository,
  );

  return { adapter, client, repository };
}

function createExpandParams(): ExpandKeywordsParams {
  return {
    runId: 'seo_brief_run_ai_1' as never,
    stepId: 'seo_brief_step_ai_1' as never,
    topicSeed: 'how to earn with usdt',
    audience: 'Beginners holding USDT',
    keywordExpansionPrompt: 'Keep the keywords broad, short, and category-level.',
    productName: 'Reinforce',
    productDescription: 'Helps users put idle USDT to work',
    market: {
      country: 'Nigeria',
      language: 'English',
      locationName: 'Nigeria',
    },
    limit: 3,
  };
}

describe('DeepSeekSeoBriefAiAdapter', () => {
  it('returns structured keyword expansion results and writes llm call logs', async () => {
    const { adapter, client, repository } = createAdapter(
      [
        {
          status: 200,
          model: 'deepseek-v4-pro',
          content: JSON.stringify({
            search_hypotheses: [
              {
                query: 'is it safe to earn interest on usdt',
                hypothesis_type: 'risk',
                why_generated: 'Matches the manual fear around losing funds or getting scammed.',
                product_fit_hypothesis: 'education_bridge',
                risk_flags: [],
              },
              {
                query: 'how to earn interest on usdt without locking it',
                hypothesis_type: 'action',
                why_generated: 'Reflects the scenario of wanting productive but accessible USDT.',
                product_fit_hypothesis: 'workflow_bridge',
                risk_flags: [],
              },
              {
                query: 'binance earn vs nexo for usdt',
                hypothesis_type: 'comparison',
                why_generated: 'Uses explicit competitor ecosystem hints for validation.',
                product_fit_hypothesis: 'alternative_solution',
                risk_flags: [],
              },
            ],
          }),
          rawPayload: { id: 'resp-1' },
          tokenUsageInput: 111,
          tokenUsageOutput: 44,
          estimatedCost: null,
        },
      ],
      { input: 0.1, output: 0.2 },
    );

    const params = createExpandParams();
    const result = await adapter.expandKeywords(params);
    const logs = await repository.findByRunId(params.runId);

    expect(result.hypotheses).toHaveLength(3);
    expect(result.groups).toHaveLength(3);
    expect(result.hypotheses[0]).toMatchObject({
      keyword: 'is it safe to earn interest on usdt',
      intent: 'informational',
      hypothesisType: 'risk',
      productFitHypothesis: 'education_bridge',
    });
    expect(logs).toHaveLength(1);
    expect(logs[0]?.operation).toBe('expandKeywords');
    expect(logs[0]?.promptVersion).toBe(SEO_BRIEF_AI_PROMPT_VERSIONS.expandKeywords);
    expect(logs[0]?.status).toBe('completed');
    expect(client.requests[0]?.model).toBe('deepseek-v4-pro');
    expect(client.requests[0]?.thinkingType).toBe('enabled');
    expect(client.requests[0]?.reasoningEffort).toBe('high');
    expect(client.requests[0]?.temperature).toBeUndefined();
    expect(logs[0]?.tokenUsageInput).toBe(111);
    expect(logs[0]?.tokenUsageOutput).toBe(44);
    expect(logs[0]?.estimatedCost).toBe(0.0000199);
    expect(client.requests[0]?.systemPrompt).toContain(
      'Treat country as market context, not as a required keyword suffix.',
    );
    expect(client.requests[0]?.userPrompt).toContain(
      'Keep the keywords broad, short, and category-level.',
    );
  });

  it('repairs invalid structured output on a follow-up request and keeps both llm logs', async () => {
    const { adapter, client, repository } = createAdapter([
      {
        status: 200,
        model: 'deepseek-v4-pro',
        content: 'not valid json at all',
        rawPayload: { id: 'resp-invalid' },
        tokenUsageInput: 90,
        tokenUsageOutput: 20,
        estimatedCost: null,
      },
      {
        status: 200,
        model: 'deepseek-v4-pro',
        content: JSON.stringify({
          clusters: [
            {
              label: 'USDT passive income basics',
              primaryKeyword: 'usdt passive income',
              intent: 'informational',
              keywords: ['usdt passive income', 'usdt yield basics'],
              rationale: 'Both keywords target the same beginner learning goal.',
            },
          ],
        }),
        rawPayload: { id: 'resp-valid' },
        tokenUsageInput: 120,
        tokenUsageOutput: 50,
        estimatedCost: null,
      },
    ]);

    const params: ClusterKeywordsParams = {
      runId: 'seo_brief_run_ai_2' as never,
      stepId: 'seo_brief_step_ai_2' as never,
      topicSeed: 'how to earn with usdt',
      keywords: ['usdt passive income', 'usdt yield basics'],
    };

    const result = await adapter.clusterKeywords(params);
    const logs = await repository.findByRunId(params.runId);

    expect(result.clusters[0]?.label).toBe('USDT passive income basics');
    expect(client.requests).toHaveLength(2);
    expect(client.requests[1]?.userPrompt).toContain('Previous response was invalid');
    expect(logs).toHaveLength(2);
    expect(logs[0]?.status).toBe('failed');
    expect(logs[1]?.status).toBe('completed');
  });

  it('validates response shape strictly and throws on invalid brief payload', async () => {
    const { adapter, repository } = createAdapter([
      {
        status: 200,
        model: 'deepseek-v4-pro',
        content: JSON.stringify({
          title: 'How to Earn with USDT',
          metaTitle: 'How to Earn with USDT',
          metaDescription: 'A short description.',
          angle: 'Teach beginners the basics.',
          outline: [],
          faq: [],
          productPlacement: {
            summary: 'Mention Reinforce carefully.',
            cta: 'Learn more',
            sections: ['Conclusion'],
          },
        }),
        rawPayload: { id: 'resp-invalid-shape' },
        tokenUsageInput: 130,
        tokenUsageOutput: 60,
        estimatedCost: null,
      },
      {
        status: 200,
        model: 'deepseek-v4-pro',
        content: JSON.stringify({
          title: 'How to Earn with USDT Safely',
          metaTitle: 'How to Earn with USDT Safely',
          metaDescription: 'Learn practical options for making idle USDT productive.',
          angle: 'Begin with education, then bridge into product use.',
          outline: [
            {
              heading: 'What earning with USDT means',
              purpose: 'Define the topic clearly.',
              keyPoints: ['Clarify common options', 'Set risk expectations'],
            },
          ],
          faq: [
            {
              question: 'Is earning with USDT risk-free?',
              answer: 'No, each option has different risks and tradeoffs.',
            },
          ],
          productPlacement: {
            summary: 'Introduce Reinforce after the educational sections.',
            cta: 'See how Reinforce works',
            sections: ['Conclusion'],
          },
        }),
        rawPayload: { id: 'resp-repaired-shape' },
        tokenUsageInput: 140,
        tokenUsageOutput: 70,
        estimatedCost: null,
      },
    ]);

    const params: GenerateSeoBriefParams = {
      runId: 'seo_brief_run_ai_3' as never,
      stepId: 'seo_brief_step_ai_3' as never,
      primaryKeyword: 'how to earn with usdt',
      clusterLabel: 'USDT earning guide',
      intent: 'informational',
      audience: 'Beginners holding USDT',
      productName: 'Reinforce',
      productDescription: 'Helps users put idle USDT to work',
      market: {
        country: 'Nigeria',
        language: 'English',
      },
      productBridge: {
        fit: 'strong',
        summary: 'Reinforce can be introduced as one practical next step.',
        positioningAngle: 'Education-first bridge',
        cta: 'See how Reinforce works',
        talkingPoints: ['Idle USDT', 'Risk awareness'],
        risks: ['Avoid guaranteed income language'],
      },
    };

    const result = await adapter.generateSeoBrief(params);
    const logs = await repository.findByRunId(params.runId);

    expect(result.outline).toHaveLength(1);
    expect(logs).toHaveLength(2);
    expect(logs[0]?.status).toBe('failed');
    expect(logs[1]?.promptVersion).toBe(SEO_BRIEF_AI_PROMPT_VERSIONS.generateSeoBrief);
  });

  it('supports triage, product bridge, and cluster selection explanations as standalone methods', async () => {
    const { adapter } = createAdapter([
      {
        status: 200,
        model: 'deepseek-v4-pro',
        content: JSON.stringify({
          accepted: [
            {
              keyword: 'usdt yield guide',
              intent: 'informational',
              stage: 'awareness',
              reason: 'Good broad educational entry point.',
            },
          ],
          rejected: [
            {
              keyword: 'buy bitcoin',
              reason: 'Too far from the topic seed and product story.',
            },
          ],
        }),
        rawPayload: { id: 'triage' },
        tokenUsageInput: 10,
        tokenUsageOutput: 10,
        estimatedCost: null,
      },
      {
        status: 200,
        model: 'deepseek-v4-pro',
        content: JSON.stringify({
          fit: 'moderate',
          summary: 'The product can be introduced after educational context.',
          positioningAngle: 'Education before product',
          cta: 'Explore Reinforce',
          talkingPoints: ['Idle capital', 'Practical next steps'],
          risks: ['Do not promise fixed returns'],
        }),
        rawPayload: { id: 'bridge' },
        tokenUsageInput: 10,
        tokenUsageOutput: 10,
        estimatedCost: null,
      },
      {
        status: 200,
        model: 'deepseek-v4-pro',
        content: JSON.stringify({
          summary:
            'The selected cluster had the strongest balance of search demand and product fit.',
          reasons: ['Strong educational intent', 'Clear path to product bridge'],
          rejectedClusters: [
            {
              label: 'Advanced trading tactics',
              reason: 'Too advanced for the target audience.',
            },
          ],
        }),
        rawPayload: { id: 'selection' },
        tokenUsageInput: 10,
        tokenUsageOutput: 10,
        estimatedCost: null,
      },
    ]);

    const triageParams: TriageKeywordsParams = {
      runId: 'seo_brief_run_ai_4' as never,
      keywords: [{ keyword: 'usdt yield guide' }, { keyword: 'buy bitcoin' }],
      topicSeed: 'how to earn with usdt',
      audience: 'Beginners holding USDT',
      productName: 'Reinforce',
    };
    const bridgeParams: BuildProductBridgeParams = {
      runId: 'seo_brief_run_ai_4' as never,
      clusterLabel: 'USDT yield basics',
      primaryKeyword: 'usdt yield guide',
      intent: 'informational',
      audience: 'Beginners holding USDT',
      productName: 'Reinforce',
    };
    const explainParams: ExplainClusterSelectionParams = {
      runId: 'seo_brief_run_ai_4' as never,
      selectedClusterLabel: 'USDT yield basics',
      candidates: [
        {
          label: 'USDT yield basics',
          primaryKeyword: 'usdt yield guide',
          seoScore: 0.8,
          productScore: 0.7,
          totalScore: 0.75,
        },
      ],
    };

    const triage = await adapter.triageKeywords(triageParams);
    const bridge = await adapter.buildProductBridge(bridgeParams);
    const explanation = await adapter.explainClusterSelection(explainParams);

    expect(triage.accepted[0]?.keyword).toBe('usdt yield guide');
    expect(bridge.fit).toBe('moderate');
    expect(explanation.reasons[0]).toBe('Strong educational intent');
  });

  it('selects related keywords from structured SERP candidates', async () => {
    const { adapter, repository } = createAdapter([
      {
        status: 200,
        model: 'deepseek-v4-pro',
        content: JSON.stringify({
          selected: [
            {
              keyword: 'What is USDT used for?',
              source: 'people_also_ask',
              sourceText: 'What is USDT used for?',
              reason: 'Complete natural query from PAA.',
            },
          ],
          rejected: [
            {
              query: 'what is',
              reason: 'Fragment.',
            },
          ],
        }),
        rawPayload: { id: 'related-selection' },
        tokenUsageInput: 10,
        tokenUsageOutput: 10,
        estimatedCost: null,
      },
    ]);
    const params: SelectRelatedKeywordsParams = {
      runId: 'seo_brief_run_ai_5' as never,
      seedKeyword: 'what is USDT',
      limit: 3,
      candidates: [
        {
          query: 'What is USDT used for?',
          source: 'people_also_ask',
          sourceText: 'What is USDT used for?',
          reason: 'Direct question from PAA.',
        },
      ],
    };

    const result = await adapter.selectRelatedKeywords(params);
    const logs = await repository.findByRunId(params.runId);

    expect(result.selected[0]?.keyword).toBe('What is USDT used for?');
    expect(result.rejected[0]?.query).toBe('what is');
    expect(logs[0]?.operation).toBe('selectRelatedKeywords');
    expect(logs[0]?.promptVersion).toBe(SEO_BRIEF_AI_PROMPT_VERSIONS.selectRelatedKeywords);
  });

  it('normalizes unsupported on-page domain types instead of failing classification', async () => {
    const { adapter } = createAdapter([
      {
        status: 200,
        model: 'deepseek-v4-pro',
        content: JSON.stringify({
          ranked_keywords_targets: [
            {
              domain: 'binance.com',
              domain_type: 'cex_p2p',
              priority: 'high',
              reason: 'Relevant exchange competitor.',
            },
          ],
          onpage_only_targets: [
            {
              domain: 'example-crypto-guide.com',
              domain_type: 'crypto_education',
              reason: 'Useful article structure, but not a ranked keyword target.',
            },
          ],
          pain_signal_targets: [],
          ignored_targets: [],
        }),
        rawPayload: { id: 'domain-classification' },
        tokenUsageInput: 10,
        tokenUsageOutput: 10,
        estimatedCost: null,
      },
    ]);
    const params: ClassifySerpDomainsParams = {
      runId: 'seo_brief_run_ai_6' as never,
      topicSeed: 'how to earn with usdt',
      audience: 'Beginners holding USDT',
      productName: 'Reinforce',
      market: {
        country: 'Nigeria',
        language: 'English',
      },
      serpDomainAggregation: {
        domains: [{ domain: 'example-crypto-guide.com' }],
      },
    };

    const result = await adapter.classifySerpDomains(params);

    expect(result.onpageOnlyTargets[0]).toMatchObject({
      domain: 'example-crypto-guide.com',
      domainType: 'other',
    });
  });

  it('fills empty product insertion angle during Product Fit validation', async () => {
    const { adapter } = createAdapter([
      {
        status: 200,
        model: 'deepseek-v4-pro',
        content: JSON.stringify({
          cluster_product_fit: [
            {
              cluster_name: 'USDC on Arbitrum',
              product_fit_score: 78,
              product_fit_type: 'education_bridge',
              decision: 'approve',
              product_insertion_angle: '',
              where_to_insert: 'After explaining bridge and network risks.',
              what_not_to_claim: ['Do not promise guaranteed returns.'],
              reason: 'The cluster can support careful stablecoin education.',
            },
          ],
        }),
        rawPayload: { id: 'product-fit' },
        tokenUsageInput: 10,
        tokenUsageOutput: 10,
        estimatedCost: null,
      },
    ]);
    const params: ReviewClusterProductFitParams = {
      runId: 'seo_brief_run_ai_7' as never,
      topicSeed: 'USDC on Arbitrum',
      audience: 'Stablecoin users',
      productName: 'Northstar',
      productDescription: 'Digital asset education',
      market: {
        country: 'United States',
        language: 'English',
      },
      clusters: [
        {
          clusterName: 'USDC on Arbitrum',
          primaryKeywordCandidate: 'usdc on arbitrum',
          intent: 'informational',
          userIntent: 'Understand how USDC works on Arbitrum.',
          secondaryKeywords: [],
          questions: [],
          supportingItems: [],
          supportingItemDetails: [],
          keywords: ['usdc on arbitrum'],
          competitorUrls: [],
          sourceConfidence: 'medium',
          evidenceSummary: 'SERP cluster about USDC on Arbitrum.',
        },
      ],
    };

    const result = await adapter.reviewClusterProductFit(params);

    expect(result.clusterProductFit[0]?.productInsertionAngle).toBe(
      'No safe product insertion angle provided by AI.',
    );
  });
});
