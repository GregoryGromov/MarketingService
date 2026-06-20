import { describe, expect, it } from 'vitest';
import { SeoBriefArtifact } from '../../domain/seo-brief-artifact.entity.js';
import { SeoBriefDocument } from '../../domain/seo-brief-document.entity.js';
import { SeoBriefExternalCallLog } from '../../domain/seo-brief-external-call-log.entity.js';
import { SeoBriefLlmCallLog } from '../../domain/seo-brief-llm-call-log.entity.js';
import { SeoBriefRun } from '../../domain/seo-brief-run.aggregate.js';
import { SeoBriefRunStep } from '../../domain/seo-brief-run-step.entity.js';
import {
  InMemorySeoBriefExternalCallLogRepository,
  InMemorySeoBriefLlmLogRepository,
} from '../../testing/logging-test-harness.js';
import {
  InMemorySeoBriefArtifactRepository,
  InMemorySeoBriefDocumentRepository,
  InMemorySeoBriefRunRepository,
  InMemorySeoBriefRunStepRepository,
} from '../../testing/run-test-harness.js';
import { ListSeoBriefRunsHandler } from './list-seo-brief-runs.handler.js';
import { ListSeoBriefRunsQuery } from './list-seo-brief-runs.query.js';

describe('ListSeoBriefRunsHandler', () => {
  it('returns recent runs with final brief summary fields', async () => {
    const runRepository = new InMemorySeoBriefRunRepository();
    const documentRepository = new InMemorySeoBriefDocumentRepository();
    const artifactRepository = new InMemorySeoBriefArtifactRepository();
    const stepRepository = new InMemorySeoBriefRunStepRepository();
    const llmLogRepository = new InMemorySeoBriefLlmLogRepository();
    const externalCallLogRepository = new InMemorySeoBriefExternalCallLogRepository();

    const firstRun = SeoBriefRun.create({
      projectId: 'project_1',
      topicSeed: 'how to earn with usdt',
      country: 'Nigeria',
      language: 'English',
      audience: 'Beginners',
      productName: 'Reinforce',
      productDescription: 'Idle USDT productivity',
      brandMemorySnapshot: {
        brandName: 'Reinforce',
        productDescription: 'Idle USDT productivity',
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
    firstRun.complete();

    const secondRun = SeoBriefRun.create({
      projectId: 'project_2',
      topicSeed: 'usdt passive income basics',
      country: 'Nigeria',
      language: 'English',
      audience: 'Beginners',
      productName: 'Reinforce',
      productDescription: 'Idle USDT productivity',
      brandMemorySnapshot: {
        brandName: 'Reinforce',
        productDescription: 'Idle USDT productivity',
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
    secondRun.queue();

    await runRepository.save(firstRun);
    await runRepository.save(secondRun);
    const firstStep = SeoBriefRunStep.create({
      runId: firstRun.id,
      stage: 'brief_generation',
      status: 'completed',
      startedAt: new Date(firstRun.createdAt.getTime() + 1000),
      finishedAt: new Date(firstRun.createdAt.getTime() + 3000),
    });
    await stepRepository.save(firstStep);
    await documentRepository.save(
      SeoBriefDocument.create({
        runId: firstRun.id,
        selectedClusterPayload: {
          label: 'USDT passive income basics',
        },
        briefPayload: {
          title: 'How to Earn with USDT Safely',
        },
      }),
    );
    const llmLog = SeoBriefLlmCallLog.start({
      runId: firstRun.id,
      stepId: firstStep.id,
      operation: 'generateSeoBrief',
      model: 'deepseek-v4',
      promptVersion: 'test',
      requestPayload: {},
    });
    llmLog.complete({
      responsePayload: {},
      tokenUsageInput: 10,
      tokenUsageOutput: 20,
      estimatedCost: 0.12,
    });
    await llmLogRepository.save(llmLog);
    const externalLog = SeoBriefExternalCallLog.start({
      runId: firstRun.id,
      stepId: firstStep.id,
      provider: 'dataforseo',
      endpoint: '/test',
      requestPayload: {},
    });
    externalLog.complete({
      responsePayload: {},
      estimatedCost: 0.03,
      cacheHit: false,
    });
    await externalCallLogRepository.save(externalLog);

    const handler = new ListSeoBriefRunsHandler(
      runRepository,
      documentRepository,
      artifactRepository,
      stepRepository,
      llmLogRepository,
      externalCallLogRepository,
    );
    const result = await handler.execute(new ListSeoBriefRunsQuery({ limit: 10 }));

    expect(result).toHaveLength(2);
    expect(result[0]?.updatedAt.getTime()).toBeGreaterThanOrEqual(
      result[1]?.updatedAt.getTime() ?? 0,
    );
    expect(result.find((item) => item.id === firstRun.id)).toMatchObject({
      projectId: 'project_1',
      status: 'done',
      finalBriefTitle: 'How to Earn with USDT Safely',
      selectedClusterLabel: 'USDT passive income basics',
      hasFinalBrief: true,
      metricsSummary: {
        totalCost: 0.15,
        totalRunDurationMs: 3000,
      },
    });
    expect(result.find((item) => item.id === secondRun.id)).toMatchObject({
      projectId: 'project_2',
      status: 'queued',
      finalBriefTitle: null,
      selectedClusterLabel: null,
      hasFinalBrief: false,
    });
  });

  it('supports filtering by project and status', async () => {
    const runRepository = new InMemorySeoBriefRunRepository();
    const documentRepository = new InMemorySeoBriefDocumentRepository();
    const artifactRepository = new InMemorySeoBriefArtifactRepository();
    const stepRepository = new InMemorySeoBriefRunStepRepository();
    const llmLogRepository = new InMemorySeoBriefLlmLogRepository();
    const externalCallLogRepository = new InMemorySeoBriefExternalCallLogRepository();

    const keptRun = SeoBriefRun.create({
      projectId: 'project_kept',
      topicSeed: 'how to earn with usdt',
      country: 'Nigeria',
      language: 'English',
      audience: 'Beginners',
      productName: 'Reinforce',
      productDescription: 'Idle USDT productivity',
      brandMemorySnapshot: {
        brandName: 'Reinforce',
        productDescription: 'Idle USDT productivity',
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
    keptRun.queue();

    const skippedRun = SeoBriefRun.create({
      projectId: 'project_other',
      topicSeed: 'other topic',
      country: 'Nigeria',
      language: 'English',
      audience: 'Beginners',
      productName: 'Reinforce',
      productDescription: 'Idle USDT productivity',
      brandMemorySnapshot: {
        brandName: 'Reinforce',
        productDescription: 'Idle USDT productivity',
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
    skippedRun.complete();

    await runRepository.save(keptRun);
    await runRepository.save(skippedRun);

    const handler = new ListSeoBriefRunsHandler(
      runRepository,
      documentRepository,
      artifactRepository,
      stepRepository,
      llmLogRepository,
      externalCallLogRepository,
    );
    const result = await handler.execute(
      new ListSeoBriefRunsQuery({
        projectId: 'project_kept',
        status: 'queued',
      }),
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(keptRun.id);
  });

  it('uses artifact snapshots for run list summary when final document is missing', async () => {
    const runRepository = new InMemorySeoBriefRunRepository();
    const documentRepository = new InMemorySeoBriefDocumentRepository();
    const artifactRepository = new InMemorySeoBriefArtifactRepository();
    const stepRepository = new InMemorySeoBriefRunStepRepository();
    const llmLogRepository = new InMemorySeoBriefLlmLogRepository();
    const externalCallLogRepository = new InMemorySeoBriefExternalCallLogRepository();

    const run = SeoBriefRun.create({
      projectId: 'project_1',
      topicSeed: 'usdc on tron',
      country: 'Nigeria',
      language: 'Hausa',
      audience: 'Beginners',
      productName: 'Northstar',
      productDescription: 'Digital asset education',
      brandMemorySnapshot: {
        brandName: 'Northstar',
        productDescription: 'Digital asset education',
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
    run.complete();
    await runRepository.save(run);
    await artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id,
        stage: 'cluster_selection',
        artifactType: 'cluster_selection_snapshot',
        payload: {
          selectedCluster: {
            label: 'USDC transfers on Tron',
            primaryKeyword: 'usdc on tron',
          },
        },
      }),
    );
    await artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id,
        stage: 'brief_generation',
        artifactType: 'final_brief_snapshot',
        payload: {
          brief: {
            recommendedTitle: 'USDC on Tron: What Beginners Need to Know',
          },
        },
      }),
    );

    const handler = new ListSeoBriefRunsHandler(
      runRepository,
      documentRepository,
      artifactRepository,
      stepRepository,
      llmLogRepository,
      externalCallLogRepository,
    );

    const result = await handler.execute(new ListSeoBriefRunsQuery({ limit: 10 }));

    expect(result[0]).toMatchObject({
      selectedClusterLabel: 'USDC transfers on Tron',
      finalBriefTitle: 'USDC on Tron: What Beginners Need to Know',
      hasFinalBrief: true,
    });
  });
});
