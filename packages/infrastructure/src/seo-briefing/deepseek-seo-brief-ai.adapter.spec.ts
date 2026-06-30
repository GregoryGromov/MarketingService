import {
  type BuildProductBridgeParams,
  type ClassifySerpDomainsParams,
  type CleanupLongreadArticleParams,
  type ClusterKeywordsParams,
  type DraftLongreadArticleParams,
  type ExpandKeywordsParams,
  type ExplainClusterSelectionParams,
  type GenerateSeoBriefParams,
  type PackageLongreadArticleParams,
  type ReviewClusterProductFitParams,
  type SelectRelatedKeywordsParams,
  SeoBriefAiTransportError,
  type SeoBriefArtifactRepository,
  type SeoBriefLlmCallLog,
  type SeoBriefLlmCallLogId,
  type SeoBriefLlmLogRepository,
  type SeoBriefRunId,
  type SynthesizeOnPageParams,
  type TriageKeywordsParams,
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

type FakeSeoBriefAiQueueItem = SeoBriefAiCompletionResponse | Error;

class FakeSeoBriefAiHttpClient extends SeoBriefAiHttpClientPort {
  readonly requests: SeoBriefAiCompletionRequest[] = [];

  constructor(private readonly queue: FakeSeoBriefAiQueueItem[]) {
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
    if (next instanceof Error) {
      throw next;
    }

    return next;
  }
}

function createAdapter(
  queue: FakeSeoBriefAiQueueItem[],
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

  it('accepts keyword expansion hypotheses without the canonical search_hypotheses wrapper', async () => {
    const { adapter } = createAdapter([
      {
        status: 200,
        model: 'deepseek-v4-pro',
        content: JSON.stringify({
          hypotheses: [
            {
              query: 'usdt staking without lockup',
              hypothesis_type: 'action',
              why_generated: 'Matches the user scenario around keeping USDT accessible.',
              product_fit_hypothesis: 'workflow_bridge',
              risk_flags: [],
            },
          ],
        }),
        rawPayload: { id: 'resp-1' },
        tokenUsageInput: 111,
        tokenUsageOutput: 44,
        estimatedCost: null,
      },
    ]);

    const result = await adapter.expandKeywords(createExpandParams());

    expect(result.hypotheses).toHaveLength(1);
    expect(result.groups).toHaveLength(1);
    expect(result.hypotheses[0]?.keyword).toBe('usdt staking without lockup');
  });

  it('accepts keyword expansion hypotheses returned as a top-level array', async () => {
    const { adapter } = createAdapter([
      {
        status: 200,
        model: 'deepseek-v4-pro',
        content: JSON.stringify([
          {
            query: 'is usdt yield safe',
            hypothesis_type: 'risk',
            why_generated: 'Matches the risk angle in the input.',
            product_fit_hypothesis: 'education_bridge',
            risk_flags: [],
          },
        ]),
        rawPayload: { id: 'resp-1' },
        tokenUsageInput: 111,
        tokenUsageOutput: 44,
        estimatedCost: null,
      },
    ]);

    const result = await adapter.expandKeywords(createExpandParams());

    expect(result.hypotheses).toHaveLength(1);
    expect(result.groups).toHaveLength(1);
    expect(result.hypotheses[0]?.hypothesisType).toBe('risk');
  });

  it('normalizes unsupported search hypothesis types instead of failing keyword expansion', async () => {
    const { adapter } = createAdapter([
      {
        status: 200,
        model: 'deepseek-v4-pro',
        content: JSON.stringify({
          search_hypotheses: [
            {
              query: 'usdt trc20 fee guide',
              hypothesis_type: 'technical',
              why_generated: 'The query asks for technical network fee education.',
              product_fit_hypothesis: 'education_bridge',
              risk_flags: [],
            },
          ],
        }),
        rawPayload: { id: 'resp-unsupported-type' },
        tokenUsageInput: 111,
        tokenUsageOutput: 44,
        estimatedCost: null,
      },
    ]);

    const result = await adapter.expandKeywords(createExpandParams());

    expect(result.hypotheses).toHaveLength(1);
    expect(result.hypotheses[0]?.hypothesisType).toBe('education');
    expect(result.groups?.[0]?.groupId).toBe('education');
  });

  it('retries transient AI JSON transport failures before validating structured output', async () => {
    const { adapter, client, repository } = createAdapter([
      new SeoBriefAiTransportError('Unexpected end of JSON input', 'completion', 'openrouter', 200),
      {
        status: 200,
        model: 'deepseek-v4-pro',
        content: JSON.stringify({
          search_hypotheses: [
            {
              query: 'how to earn yield on usdt',
              hypothesis_type: 'action',
              why_generated: 'Matches the action intent in the brief.',
              product_fit_hypothesis: 'workflow_bridge',
              risk_flags: [],
            },
          ],
        }),
        rawPayload: { id: 'resp-retry-ok' },
        tokenUsageInput: 111,
        tokenUsageOutput: 44,
        estimatedCost: null,
      },
    ]);

    const params = createExpandParams();
    const result = await adapter.expandKeywords(params);
    const logs = await repository.findByRunId(params.runId);

    expect(client.requests).toHaveLength(2);
    expect(result.hypotheses).toHaveLength(1);
    expect(logs).toHaveLength(1);
    expect(logs[0]?.status).toBe('completed');
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
    const { adapter, client, repository } = createAdapter([
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
      brandMemorySnapshot: {
        brandName: 'Reinforce',
        productDescription: 'Helps users put idle USDT to work',
        targetAudience: 'Beginners holding USDT',
        approvedFacts: ['Education-first product context'],
        forbiddenClaims: [
          `${'Do not include this very long forbidden claim. '.repeat(40)}FULL_FINAL_BRIEF_BRAND_MEMORY_TAIL_SHOULD_NOT_APPEAR`,
        ],
        glossary: {},
        bannedPhrases: [],
        requiredPhrases: ['risk-aware'],
        brandDocs: [],
        adaptationPromptRules: null,
      },
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
      clusterSelection: {
        mainCluster: {
          clusterName: 'USDT earning guide',
          primaryKeyword: 'how to earn with usdt',
          sourceCandidate: {
            rawEvidence: 'RAW_CLUSTER_EVIDENCE_SHOULD_NOT_APPEAR',
          },
        },
      },
      onPageSynthesis: {
        competitorStructureSummary: {
          commonH2Patterns: ['What USDT earning means', 'Risk and platform comparison'],
          contentGaps: ['Explain risk without promising returns.'],
        },
        rawResponse: 'RAW_ONPAGE_RESPONSE_SHOULD_NOT_APPEAR',
      },
      productFitReview: {
        clusterProductFit: [
          {
            clusterName: 'USDT earning guide',
            decision: 'approve',
            productInsertionAngle: 'Education-first bridge',
          },
        ],
      },
      keywordCandidateScoring: {
        accepted: [{ keyword: 'how to earn with usdt', reason: 'Strong topic fit.' }],
        rawResponse: 'RAW_KEYWORD_SCORING_SHOULD_NOT_APPEAR',
      },
      serpEnrichmentContext: {
        derivedCandidates: ['usdt earning risks'],
        markdownPreview: 'RAW_SERP_MARKDOWN_SHOULD_NOT_APPEAR',
      },
      competitorKeywordEvidence: {
        keywordMatches: ['usdt yield guide'],
        requestPayload: 'RAW_COMPETITOR_REQUEST_SHOULD_NOT_APPEAR',
      },
    };

    const result = await adapter.generateSeoBrief(params);
    const logs = await repository.findByRunId(params.runId);

    expect(result.outline).toHaveLength(1);
    expect(logs).toHaveLength(2);
    expect(logs[0]?.status).toBe('failed');
    expect(logs[1]?.promptVersion).toBe(SEO_BRIEF_AI_PROMPT_VERSIONS.generateSeoBrief);
    expect(client.requests[0]?.userPrompt).toContain('FINAL_BRIEF_CONTEXT_JSON=');
    expect(client.requests[0]?.userPrompt).toContain('FINAL_BRIEF_EVIDENCE_JSON=');
    expect(client.requests[0]?.userPrompt).toContain('USDT earning guide');
    expect(client.requests[0]?.userPrompt).toContain('What USDT earning means');
    expect(client.requests[0]?.userPrompt).not.toContain('sourceCandidate');
    expect(client.requests[0]?.userPrompt).not.toContain('RAW_CLUSTER_EVIDENCE_SHOULD_NOT_APPEAR');
    expect(client.requests[0]?.userPrompt).not.toContain('RAW_ONPAGE_RESPONSE_SHOULD_NOT_APPEAR');
    expect(client.requests[0]?.userPrompt).not.toContain('RAW_KEYWORD_SCORING_SHOULD_NOT_APPEAR');
    expect(client.requests[0]?.userPrompt).not.toContain('RAW_SERP_MARKDOWN_SHOULD_NOT_APPEAR');
    expect(client.requests[0]?.userPrompt).not.toContain(
      'RAW_COMPETITOR_REQUEST_SHOULD_NOT_APPEAR',
    );
    expect(client.requests[0]?.userPrompt).not.toContain(
      'FULL_FINAL_BRIEF_BRAND_MEMORY_TAIL_SHOULD_NOT_APPEAR',
    );
  });

  it('sends compact article draft context instead of full final brief payload', async () => {
    const { adapter, client, repository } = createAdapter([
      {
        status: 200,
        model: 'deepseek-v4-pro',
        content: JSON.stringify({
          draftArticleMarkdown:
            '# How to Earn with USDT Safely\n\n## What earning with USDT means\n\nA clear beginner explanation.',
        }),
        rawPayload: { id: 'draft-article' },
        tokenUsageInput: 10,
        tokenUsageOutput: 10,
        estimatedCost: null,
      },
    ]);
    const params: DraftLongreadArticleParams = {
      runId: 'seo_brief_run_ai_4' as never,
      stepId: 'seo_brief_step_ai_4' as never,
      finalSeoBrief: {
        market: {
          country: 'Nigeria',
          language: 'English',
        },
        topicHint: 'USDT earning',
        mainCluster: 'USDT earning guide',
        supportingClusters: ['USDT risks'],
        primaryKeyword: 'how to earn with usdt',
        secondaryKeywords: ['usdt yield', 'usdt earning risks'],
        searchIntent: 'Learn safe ways to evaluate USDT earning options.',
        targetReader: 'Beginners holding USDT',
        contentType: 'educational guide',
        recommendedTitle: 'How to Earn with USDT Safely',
        recommendedH1: 'How to Earn with USDT Safely',
        recommendedMetaTitle: 'How to Earn with USDT Safely',
        recommendedMetaDescription: 'Learn practical options and risks.',
        outline: [
          {
            h2: 'What earning with USDT means',
            h3: ['Common options', 'Basic risks'],
            notes: 'Define the topic before product mention.',
            rawEvidence: 'RAW_OUTLINE_EVIDENCE_SHOULD_NOT_APPEAR',
          },
        ],
        faq: [
          {
            question: 'Is earning with USDT risk-free?',
            answerDirection: 'No. Explain risk clearly.',
          },
        ],
        productInsertion: {
          where: 'Conclusion',
          how: 'Mention Reinforce as one possible option.',
          sampleAngle: 'Education-first bridge.',
          avoid: ['Do not promise guaranteed returns.'],
        },
        competitorGapsToFill: ['Explain risk simply.'],
        riskNotes: ['Avoid guaranteed returns.'],
        cta: 'See how Reinforce works',
        internalLinks: ['USDT guide'],
        externalSourcesNeeded: ['Current APY source if APY is mentioned'],
        legacy: {
          rawResponse: 'RAW_LEGACY_BRIEF_SHOULD_NOT_APPEAR',
        },
      },
      productProfile: {
        productName: 'Reinforce',
        mainValue: 'Helps users put idle USDT to work',
        rawPayload: 'RAW_PRODUCT_PROFILE_SHOULD_NOT_APPEAR',
      },
      claimsPolicy: {
        notAllowedClaims: ['guaranteed profit'],
        rawResponse: 'RAW_CLAIMS_POLICY_SHOULD_NOT_APPEAR',
      },
      brandVoice: {
        tone: 'clear and risk-aware',
        responsePayload: 'RAW_BRAND_VOICE_SHOULD_NOT_APPEAR',
      },
      targetLength: 'longread',
      publishingFormat: 'markdown',
    };

    const result = await adapter.draftLongreadArticle(params);
    const logs = await repository.findByRunId(params.runId);

    expect(result.draftArticleMarkdown).toContain('# How to Earn with USDT Safely');
    expect(logs[0]?.promptVersion).toBe(SEO_BRIEF_AI_PROMPT_VERSIONS.draftLongreadArticle);
    expect(client.requests[0]?.userPrompt).toContain('ARTICLE_DRAFT_CONTEXT_JSON=');
    expect(client.requests[0]?.userPrompt).toContain('How to Earn with USDT Safely');
    expect(client.requests[0]?.userPrompt).toContain('What earning with USDT means');
    expect(client.requests[0]?.userPrompt).not.toContain('legacy');
    expect(client.requests[0]?.userPrompt).not.toContain('RAW_LEGACY_BRIEF_SHOULD_NOT_APPEAR');
    expect(client.requests[0]?.userPrompt).not.toContain('RAW_OUTLINE_EVIDENCE_SHOULD_NOT_APPEAR');
    expect(client.requests[0]?.userPrompt).not.toContain('RAW_PRODUCT_PROFILE_SHOULD_NOT_APPEAR');
    expect(client.requests[0]?.userPrompt).not.toContain('RAW_CLAIMS_POLICY_SHOULD_NOT_APPEAR');
    expect(client.requests[0]?.userPrompt).not.toContain('RAW_BRAND_VOICE_SHOULD_NOT_APPEAR');
  });

  it('sends full article but compact cleanup context without raw brief payloads', async () => {
    const { adapter, client, repository } = createAdapter([
      {
        status: 200,
        model: 'deepseek-v4-pro',
        content: JSON.stringify({
          status: 'passed_with_warnings',
          warnings: [
            {
              type: 'claims',
              severity: 'note',
              message: 'Risk wording is conservative.',
            },
          ],
          changesMade: ['Softened product wording.'],
          articleMarkdown:
            '# How to Earn with USDT Safely\n\n## What earning with USDT means\n\nARTICLE_BODY_MUST_REMAIN',
        }),
        rawPayload: { id: 'cleanup-article' },
        tokenUsageInput: 10,
        tokenUsageOutput: 10,
        estimatedCost: null,
      },
    ]);
    const params: CleanupLongreadArticleParams = {
      runId: 'seo_brief_run_ai_5' as never,
      stepId: 'seo_brief_step_ai_5' as never,
      draftArticleMarkdown:
        '# How to Earn with USDT Safely\n\n## What earning with USDT means\n\nARTICLE_BODY_MUST_REMAIN',
      finalSeoBrief: {
        market: {
          country: 'Nigeria',
          language: 'English',
        },
        topicHint: 'USDT earning',
        mainCluster: 'USDT earning guide',
        primaryKeyword: 'how to earn with usdt',
        secondaryKeywords: ['usdt yield'],
        searchIntent: 'Learn safe ways to evaluate USDT earning options.',
        targetReader: 'Beginners holding USDT',
        recommendedTitle: 'How to Earn with USDT Safely',
        recommendedH1: 'How to Earn with USDT Safely',
        outline: [
          {
            h2: 'What earning with USDT means',
            h3: ['Common options'],
            notes: 'Define the topic before product mention.',
            rawEvidence: 'RAW_CLEANUP_OUTLINE_EVIDENCE_SHOULD_NOT_APPEAR',
          },
        ],
        faq: [
          {
            question: 'Is earning with USDT risk-free?',
            answerDirection: 'No.',
          },
        ],
        productInsertion: {
          where: 'Conclusion',
          how: 'Mention Reinforce as one possible option.',
          sampleAngle: 'Education-first bridge.',
          avoid: ['Do not promise guaranteed returns.'],
        },
        riskNotes: ['Avoid guaranteed returns.'],
        cta: 'See how Reinforce works',
        legacy: {
          rawResponse: 'RAW_CLEANUP_LEGACY_BRIEF_SHOULD_NOT_APPEAR',
        },
      },
      productProfile: {
        productName: 'Reinforce',
        rawPayload: 'RAW_CLEANUP_PRODUCT_PROFILE_SHOULD_NOT_APPEAR',
      },
      claimsPolicy: {
        notAllowedClaims: ['guaranteed profit'],
        responsePayload: 'RAW_CLEANUP_CLAIMS_POLICY_SHOULD_NOT_APPEAR',
      },
      brandVoice: {
        tone: 'clear and risk-aware',
        requestPayload: 'RAW_CLEANUP_BRAND_VOICE_SHOULD_NOT_APPEAR',
      },
      reviewAttempt: 2,
      previousReviewFindings: [
        {
          attempt: 1,
          status: 'revised',
          warnings: [
            {
              type: 'claims',
              severity: 'warning',
              message: 'Remove guaranteed return wording.',
              rawEvidence: 'RAW_PREVIOUS_FINDING_EVIDENCE_SHOULD_NOT_APPEAR',
            },
          ],
          changesMade: ['Removed hard claims.'],
          articleMarkdown: 'RAW_PREVIOUS_ARTICLE_SHOULD_NOT_APPEAR',
          markdownLength: 1234,
        },
      ],
    };

    const result = await adapter.cleanupLongreadArticle(params);
    const logs = await repository.findByRunId(params.runId);

    expect(result.status).toBe('passed_with_warnings');
    expect(logs[0]?.promptVersion).toBe(SEO_BRIEF_AI_PROMPT_VERSIONS.cleanupLongreadArticle);
    expect(client.requests[0]?.userPrompt).toContain('ARTICLE_CLEANUP_CONTEXT_JSON=');
    expect(client.requests[0]?.userPrompt).toContain('ARTICLE_BODY_MUST_REMAIN');
    expect(client.requests[0]?.userPrompt).toContain('How to Earn with USDT Safely');
    expect(client.requests[0]?.userPrompt).not.toContain('legacy');
    expect(client.requests[0]?.userPrompt).not.toContain(
      'RAW_CLEANUP_LEGACY_BRIEF_SHOULD_NOT_APPEAR',
    );
    expect(client.requests[0]?.userPrompt).not.toContain(
      'RAW_CLEANUP_OUTLINE_EVIDENCE_SHOULD_NOT_APPEAR',
    );
    expect(client.requests[0]?.userPrompt).not.toContain(
      'RAW_CLEANUP_PRODUCT_PROFILE_SHOULD_NOT_APPEAR',
    );
    expect(client.requests[0]?.userPrompt).not.toContain(
      'RAW_CLEANUP_CLAIMS_POLICY_SHOULD_NOT_APPEAR',
    );
    expect(client.requests[0]?.userPrompt).not.toContain(
      'RAW_CLEANUP_BRAND_VOICE_SHOULD_NOT_APPEAR',
    );
    expect(client.requests[0]?.userPrompt).not.toContain(
      'RAW_PREVIOUS_FINDING_EVIDENCE_SHOULD_NOT_APPEAR',
    );
    expect(client.requests[0]?.userPrompt).not.toContain('RAW_PREVIOUS_ARTICLE_SHOULD_NOT_APPEAR');
  });

  it('sends full reviewed article but compact package context without raw payloads', async () => {
    const { adapter, client, repository } = createAdapter([
      {
        status: 200,
        model: 'deepseek-v4-pro',
        content: JSON.stringify({
          article: {
            title: 'How to Earn with USDT Safely',
            slug: 'how-to-earn-with-usdt-safely',
            metaTitle: 'How to Earn with USDT Safely',
            metaDescription: 'Learn practical options and risks.',
            h1: 'How to Earn with USDT Safely',
            bodyMarkdown:
              '# How to Earn with USDT Safely\n\n## What earning with USDT means\n\nPACKAGED_ARTICLE_BODY',
          },
          seo: {
            primaryKeyword: 'how to earn with usdt',
            secondaryKeywordsUsed: ['usdt yield'],
            searchIntent: 'Learn safe ways to evaluate USDT earning options.',
            contentType: 'educational guide',
            faqIncluded: true,
            internalLinks: ['USDT guide'],
            externalSourcesNeeded: ['Current APY source if APY is mentioned'],
          },
          productInsertion: {
            whereInserted: 'Conclusion',
            angleUsed: 'Education-first bridge.',
            forced: false,
          },
          claimsReview: {
            status: 'passed_with_warnings',
            warnings: ['Risk wording is conservative.'],
          },
          publishingChecklist: {
            readyToPublish: false,
            needsExternalFactCheck: true,
            needsComplianceReview: false,
            notes: ['External source needed if APY is mentioned.'],
          },
        }),
        rawPayload: { id: 'package-article' },
        tokenUsageInput: 10,
        tokenUsageOutput: 10,
        estimatedCost: null,
      },
    ]);
    const params: PackageLongreadArticleParams = {
      runId: 'seo_brief_run_ai_6' as never,
      stepId: 'seo_brief_step_ai_6' as never,
      reviewedArticleMarkdown:
        '# How to Earn with USDT Safely\n\n## What earning with USDT means\n\nPACKAGED_ARTICLE_BODY',
      finalSeoBrief: {
        market: {
          country: 'Nigeria',
          language: 'English',
        },
        topicHint: 'USDT earning',
        mainCluster: 'USDT earning guide',
        primaryKeyword: 'how to earn with usdt',
        secondaryKeywords: ['usdt yield'],
        searchIntent: 'Learn safe ways to evaluate USDT earning options.',
        targetReader: 'Beginners holding USDT',
        recommendedTitle: 'How to Earn with USDT Safely',
        recommendedH1: 'How to Earn with USDT Safely',
        recommendedMetaTitle: 'How to Earn with USDT Safely',
        recommendedMetaDescription: 'Learn practical options and risks.',
        outline: [
          {
            h2: 'What earning with USDT means',
            h3: ['Common options'],
            notes: 'Define the topic before product mention.',
            rawEvidence: 'RAW_PACKAGE_OUTLINE_EVIDENCE_SHOULD_NOT_APPEAR',
          },
        ],
        faq: [
          {
            question: 'Is earning with USDT risk-free?',
            answerDirection: 'No.',
          },
        ],
        productInsertion: {
          where: 'Conclusion',
          how: 'Mention Reinforce as one possible option.',
          sampleAngle: 'Education-first bridge.',
          avoid: ['Do not promise guaranteed returns.'],
        },
        riskNotes: ['Avoid guaranteed returns.'],
        cta: 'See how Reinforce works',
        internalLinks: ['USDT guide'],
        externalSourcesNeeded: ['Current APY source if APY is mentioned'],
        legacy: {
          rawResponse: 'RAW_PACKAGE_LEGACY_BRIEF_SHOULD_NOT_APPEAR',
        },
      },
      cleanupWarnings: [
        {
          type: 'claims',
          severity: 'note',
          message: 'Risk wording is conservative.',
          rawEvidence: 'RAW_PACKAGE_WARNING_EVIDENCE_SHOULD_NOT_APPEAR',
        },
      ] as unknown as PackageLongreadArticleParams['cleanupWarnings'],
      productProfile: {
        productName: 'Reinforce',
        mainValue: 'Helps users put idle USDT to work',
        rawPayload: 'RAW_PACKAGE_PRODUCT_PROFILE_SHOULD_NOT_APPEAR',
      },
    };

    const result = await adapter.packageLongreadArticle(params);
    const logs = await repository.findByRunId(params.runId);

    expect(result.article.slug).toBe('how-to-earn-with-usdt-safely');
    expect(logs[0]?.promptVersion).toBe(SEO_BRIEF_AI_PROMPT_VERSIONS.packageLongreadArticle);
    expect(client.requests[0]?.userPrompt).toContain('ARTICLE_PACKAGE_CONTEXT_JSON=');
    expect(client.requests[0]?.userPrompt).toContain('PACKAGED_ARTICLE_BODY');
    expect(client.requests[0]?.userPrompt).toContain('How to Earn with USDT Safely');
    expect(client.requests[0]?.userPrompt).toContain('Risk wording is conservative.');
    expect(client.requests[0]?.userPrompt).not.toContain('legacy');
    expect(client.requests[0]?.userPrompt).not.toContain(
      'RAW_PACKAGE_LEGACY_BRIEF_SHOULD_NOT_APPEAR',
    );
    expect(client.requests[0]?.userPrompt).not.toContain(
      'RAW_PACKAGE_OUTLINE_EVIDENCE_SHOULD_NOT_APPEAR',
    );
    expect(client.requests[0]?.userPrompt).not.toContain(
      'RAW_PACKAGE_WARNING_EVIDENCE_SHOULD_NOT_APPEAR',
    );
    expect(client.requests[0]?.userPrompt).not.toContain(
      'RAW_PACKAGE_PRODUCT_PROFILE_SHOULD_NOT_APPEAR',
    );
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
    const { adapter, client } = createAdapter([
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
      brandMemorySnapshot: {
        brandName: 'Northstar',
        productDescription: 'Digital asset education',
        targetAudience: 'Stablecoin users',
        approvedFacts: ['Education-first product context'],
        forbiddenClaims: [
          `${'Do not include this very long forbidden claim. '.repeat(40)}FULL_BRAND_MEMORY_TAIL_SHOULD_NOT_APPEAR`,
        ],
        glossary: {},
        bannedPhrases: [],
        requiredPhrases: ['education-first'],
        brandDocs: [],
        adaptationPromptRules: null,
      },
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
          secondaryKeywords: ['arbitrum usdc bridge'],
          questions: ['is USDC safe on Arbitrum'],
          supportingItems: ['arbitrum usdc bridge'],
          supportingItemDetails: [
            {
              text: 'arbitrum usdc bridge',
              originType: 'dirty_keyword_pool',
              sources: ['serp_derived_candidate', 'ai_fit_scoring'],
              candidateScore: 72,
              metrics: {
                searchVolume: 390,
                keywordDifficulty: 27,
                bestRankAbsolute: 4,
                proxyDemandScore: 66,
              },
              whyInCluster: 'Bridge workflow supports the user intent.',
              sourceCandidate: {
                text: 'arbitrum usdc bridge',
                rawEvidence: 'this raw nested evidence should not be sent to Product Fit AI',
              },
            },
          ],
          keywords: ['usdc on arbitrum'],
          competitorUrls: [
            {
              domain: 'arbitrum.io',
              rankAbsolute: 2,
              title: 'USDC on Arbitrum',
              url: 'https://arbitrum.io/usdc',
            },
          ],
          sourceConfidence: 'medium',
          evidenceSummary: 'SERP cluster about USDC on Arbitrum.',
        },
      ],
    };

    const result = await adapter.reviewClusterProductFit(params);

    expect(result.clusterProductFit[0]?.productInsertionAngle).toBe(
      'No safe product insertion angle provided by AI.',
    );
    expect(client.requests[0]?.userPrompt).toContain('PRODUCT_FIT_CONTEXT_JSON=');
    expect(client.requests[0]?.userPrompt).toContain('CLUSTERS:');
    expect(client.requests[0]?.userPrompt).toContain('name=USDC on Arbitrum');
    expect(client.requests[0]?.userPrompt).toContain('kw=arbitrum usdc bridge');
    expect(client.requests[0]?.userPrompt).not.toContain('support=');
    expect(client.requests[0]?.userPrompt).not.toContain('urls=');
    expect(client.requests[0]?.userPrompt).not.toContain('ev=');
    expect(client.requests[0]?.userPrompt).not.toContain('sourceCandidate');
    expect(client.requests[0]?.userPrompt).not.toContain('raw nested evidence');
  });

  it('sends compact on-page synthesis evidence instead of raw page payloads', async () => {
    const { adapter, client } = createAdapter([
      {
        status: 200,
        model: 'deepseek-v4-pro',
        content: JSON.stringify({
          competitor_structure_summary: {
            common_h2_patterns: ['What USDC on Arbitrum means', 'How bridges work'],
            common_content_blocks: ['Definitions', 'Risk notes'],
            common_faq_questions: ['Is USDC safe on Arbitrum?'],
            common_tables_or_comparisons: ['Bridge comparison table'],
            content_gaps: ['Explain wallet setup in simpler language.'],
          },
          recommended_article_structure: {
            h1: 'USDC on Arbitrum: beginner guide',
            h2: [
              {
                heading: 'What USDC on Arbitrum means',
                purpose: 'Define the topic.',
                subpoints: ['Explain native vs bridged assets.'],
              },
            ],
            faq: ['Is USDC safe on Arbitrum?'],
          },
          product_insertion: {
            section: 'After risk explanation',
            angle: 'Education-first product bridge',
            do: ['Keep claims conservative.'],
            avoid: ['Do not promise risk-free returns.'],
          },
          risk_and_compliance_notes: ['Avoid guaranteed return claims.'],
        }),
        rawPayload: { id: 'onpage-synthesis' },
        tokenUsageInput: 10,
        tokenUsageOutput: 10,
        estimatedCost: null,
      },
    ]);
    const params: SynthesizeOnPageParams = {
      runId: 'seo_brief_run_ai_8' as never,
      stepId: 'seo_brief_step_ai_8' as never,
      topicSeed: 'USDC on Arbitrum',
      audience: 'Stablecoin beginners',
      productName: 'Northstar',
      productDescription: 'Digital asset education',
      brandMemorySnapshot: {
        brandName: 'Northstar',
        productDescription: 'Digital asset education',
        targetAudience: 'Stablecoin beginners',
        approvedFacts: ['Education-first product context'],
        forbiddenClaims: [
          `${'Do not include this very long forbidden claim. '.repeat(40)}FULL_BRAND_MEMORY_TAIL_SHOULD_NOT_APPEAR`,
        ],
        glossary: {},
        bannedPhrases: [],
        requiredPhrases: ['education-first'],
        brandDocs: [],
        adaptationPromptRules: null,
      },
      market: {
        country: 'United States',
        language: 'English',
      },
      clusterSelection: {
        mainCluster: {
          clusterName: 'USDC on Arbitrum',
          primaryKeyword: 'usdc on arbitrum',
        },
      },
      onPagePages: [
        {
          domain: 'example.com',
          url: 'https://example.com/usdc-arbitrum',
          role: 'selected_cluster_competitor',
          sourceQuery: 'usdc on arbitrum',
          title: 'USDC on Arbitrum explained',
          metaDescription: 'A guide to USDC on Arbitrum.',
          canonical: 'https://example.com/usdc-arbitrum',
          h1: ['USDC on Arbitrum'],
          h2: ['What is USDC on Arbitrum?', 'How bridges work'],
          h3: ['Native USDC', 'Bridge risk'],
          textBlocks: ['This compact lead explains the network and bridge context for beginners.'],
          markdownPreview: `${'Long raw markdown body. '.repeat(
            50,
          )}RAW_MARKDOWN_TAIL_SHOULD_NOT_APPEAR`,
          importantLinks: [
            {
              text: 'Arbitrum docs',
              domain: 'docs.arbitrum.io',
              url: 'https://docs.arbitrum.io/',
            },
          ],
        },
      ],
    };

    const result = await adapter.synthesizeOnPage(params);

    expect(result.recommendedArticleStructure.h1).toBe('USDC on Arbitrum: beginner guide');
    expect(client.requests[0]?.userPrompt).toContain('ONPAGE_CONTEXT_JSON=');
    expect(client.requests[0]?.userPrompt).toContain('PAGES:');
    expect(client.requests[0]?.userPrompt).toContain('dom=example.com');
    expect(client.requests[0]?.userPrompt).toContain('h2=What is USDC on Arbitrum?');
    expect(client.requests[0]?.userPrompt).not.toContain('markdownPreview');
    expect(client.requests[0]?.userPrompt).not.toContain('textBlocks');
    expect(client.requests[0]?.userPrompt).not.toContain('importantLinks');
    expect(client.requests[0]?.userPrompt).not.toContain('RAW_MARKDOWN_TAIL_SHOULD_NOT_APPEAR');
    expect(client.requests[0]?.userPrompt).not.toContain(
      'FULL_BRAND_MEMORY_TAIL_SHOULD_NOT_APPEAR',
    );
  });
});
