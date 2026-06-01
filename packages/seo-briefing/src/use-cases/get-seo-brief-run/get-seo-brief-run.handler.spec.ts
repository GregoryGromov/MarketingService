import { describe, expect, it } from 'vitest';
import { SeoBriefArtifact } from '../../domain/seo-brief-artifact.entity.js';
import { SeoBriefDocument } from '../../domain/seo-brief-document.entity.js';
import { SeoBriefExternalCallLog } from '../../domain/seo-brief-external-call-log.entity.js';
import { SeoBriefLlmCallLog } from '../../domain/seo-brief-llm-call-log.entity.js';
import { SeoBriefRun } from '../../domain/seo-brief-run.aggregate.js';
import { SeoBriefRunStep } from '../../domain/seo-brief-run-step.entity.js';
import { SeoBriefScoreLog } from '../../domain/seo-brief-score-log.entity.js';
import {
  InMemorySeoBriefExternalCallLogRepository,
  InMemorySeoBriefLlmLogRepository,
  InMemorySeoBriefScoreLogRepository,
} from '../../testing/logging-test-harness.js';
import {
  InMemorySeoBriefArtifactRepository,
  InMemorySeoBriefDocumentRepository,
  InMemorySeoBriefRunRepository,
  InMemorySeoBriefRunStepRepository,
} from '../../testing/run-test-harness.js';
import { GetSeoBriefRunHandler } from './get-seo-brief-run.handler.js';
import { GetSeoBriefRunQuery } from './get-seo-brief-run.query.js';

describe('GetSeoBriefRunHandler', () => {
  it('returns run details together with steps and artifacts', async () => {
    const runRepository = new InMemorySeoBriefRunRepository();
    const stepRepository = new InMemorySeoBriefRunStepRepository();
    const artifactRepository = new InMemorySeoBriefArtifactRepository();
    const documentRepository = new InMemorySeoBriefDocumentRepository();
    const llmLogRepository = new InMemorySeoBriefLlmLogRepository();
    const externalCallLogRepository = new InMemorySeoBriefExternalCallLogRepository();
    const scoreLogRepository = new InMemorySeoBriefScoreLogRepository();

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
      keyMessage: 'Idle USDT can be productive',
      audienceBefore: 'Confused',
      audienceAfter: 'Informed',
      cta: 'Learn more',
      seoWeight: 0.6,
      productWeight: 0.4,
    });
    const step = SeoBriefRunStep.create({
      runId: run.id,
      stage: 'created',
      status: 'completed',
      startedAt: run.createdAt,
      finishedAt: run.createdAt,
    });
    const artifact = SeoBriefArtifact.create({
      runId: run.id,
      stage: 'created',
      artifactType: 'normalized_input',
      payload: {
        topicSeed: run.topicSeed,
      },
    });
    const llmLog = SeoBriefLlmCallLog.start({
      runId: run.id,
      stepId: step.id,
      operation: 'expandKeywords',
      model: 'deepseek-v4-flash',
      promptVersion: 'seo-brief.expand-keywords.v1',
      requestPayload: { topicSeed: run.topicSeed },
    });
    llmLog.complete({
      responsePayload: { hypotheses: [] },
      tokenUsageInput: 100,
      tokenUsageOutput: 40,
      estimatedCost: 0,
    });
    const externalCallLog = SeoBriefExternalCallLog.start({
      runId: run.id,
      stepId: step.id,
      provider: 'dataforseo',
      endpoint: '/v3/keywords_data/google/search_volume/live',
      requestPayload: { keywords: [run.topicSeed] },
    });
    externalCallLog.complete({
      responsePayload: { items: [] },
      estimatedCost: 0.02,
      cacheHit: false,
    });
    const scoreLog = SeoBriefScoreLog.create({
      runId: run.id,
      stepId: step.id,
      formulaName: 'seo_score',
      inputPayload: { demandScore: 80, competitionScore: 50 },
      resultPayload: { value: 69.5 },
    });
    const document = SeoBriefDocument.create({
      runId: run.id,
      selectedClusterPayload: {
        label: 'USDT passive income basics',
        primaryKeyword: 'usdt passive income',
        finalScore: 72.5,
      },
      briefPayload: {
        title: 'How to Earn with USDT Safely',
        metaTitle: 'How to Earn with USDT Safely',
      },
      rejectedClustersPayload: [
        {
          label: 'Advanced USDT trading',
          reason: 'Too advanced for the target audience',
        },
      ],
    });

    await runRepository.save(run);
    await stepRepository.save(step);
    await artifactRepository.save(artifact);
    await artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id,
        stage: 'related_keyword_research',
        artifactType: 'research_v1_summary',
        payload: {
          hypothesisCount: 2,
          keywordCount: 3,
        },
      }),
    );
    await artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id,
        stage: 'related_keyword_research',
        artifactType: 'research_v1_summary',
        payload: {
          hypothesisCount: 4,
          keywordCount: 6,
        },
        attempt: 2,
      }),
    );
    await artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id,
        stage: 'onpage_research',
        artifactType: 'research_v2_summary',
        payload: {
          domainCount: 2,
          onpageTargetCount: 3,
        },
      }),
    );
    await artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id,
        stage: 'cluster_selection',
        artifactType: 'cluster_selection_snapshot',
        payload: {
          outcome: 'done',
          reason: null,
        },
      }),
    );
    await documentRepository.save(document);
    await llmLogRepository.save(llmLog);
    await externalCallLogRepository.save(externalCallLog);
    await scoreLogRepository.save(scoreLog);

    const handler = new GetSeoBriefRunHandler(
      runRepository,
      stepRepository,
      artifactRepository,
      documentRepository,
      llmLogRepository,
      externalCallLogRepository,
      scoreLogRepository,
    );
    const result = await handler.execute(new GetSeoBriefRunQuery(run.id));

    expect(result).not.toBeNull();
    expect(result?.id).toBe(run.id);
    expect(result?.status).toBe('created');
    expect(result?.market).toEqual({
      country: 'Nigeria',
      language: 'English',
    });
    expect(result?.product).toEqual({
      name: 'Reinforce',
      description: 'Helps users make idle USDT productive',
    });
    expect(result?.steps).toHaveLength(1);
    expect(result?.artifacts).toHaveLength(5);
    expect(result?.llmCalls).toHaveLength(1);
    expect(result?.externalCalls).toHaveLength(1);
    expect(result?.scoreLogs).toHaveLength(1);
    expect(result?.operationalLimits).toMatchObject({
      maxClustersToScore: 5,
      maxManualRerunAttemptsPerStage: 3,
    });
    expect(result?.metrics).toMatchObject({
      totalLlmCost: 0,
      totalExternalCost: 0.02,
      totalCost: 0.02,
      llmCallCount: 1,
      externalCallCount: 1,
      scoreLogCount: 1,
      cacheHitCount: 0,
    });
    expect(result?.finalBrief?.briefPayload).toEqual({
      title: 'How to Earn with USDT Safely',
      metaTitle: 'How to Earn with USDT Safely',
    });
    expect(result?.evidencePack).toMatchObject({
      finalBriefPayload: {
        title: 'How to Earn with USDT Safely',
        metaTitle: 'How to Earn with USDT Safely',
      },
      selectedClusterPayload: {
        label: 'USDT passive income basics',
        primaryKeyword: 'usdt passive income',
        finalScore: 72.5,
      },
      trail: {
        llmCallCount: 1,
        externalCallCount: 1,
        scoreLogCount: 1,
      },
      researchV1Summary: {
        hypothesisCount: 4,
        keywordCount: 6,
      },
    });
    expect(result?.llmCalls[0]?.operation).toBe('expandKeywords');
    expect(result?.externalCalls[0]?.provider).toBe('dataforseo');
    expect(result?.scoreLogs[0]?.formulaName).toBe('seo_score');
    expect(result?.artifacts[0]?.payload).toEqual({
      topicSeed: 'how to earn with USDT',
    });
  });

  it('returns null when run is missing', async () => {
    const handler = new GetSeoBriefRunHandler(
      new InMemorySeoBriefRunRepository(),
      new InMemorySeoBriefRunStepRepository(),
      new InMemorySeoBriefArtifactRepository(),
      new InMemorySeoBriefDocumentRepository(),
      new InMemorySeoBriefLlmLogRepository(),
      new InMemorySeoBriefExternalCallLogRepository(),
      new InMemorySeoBriefScoreLogRepository(),
    );

    const result = await handler.execute(new GetSeoBriefRunQuery('missing-run' as never));
    expect(result).toBeNull();
  });
});
