import { describe, expect, it } from 'vitest';
import { SeoBriefArtifact, SeoBriefRun } from '../../index.js';
import type {
  CleanupLongreadArticleResult as AiCleanupLongreadArticleResult,
  CleanupLongreadArticleParams,
  SeoBriefAiPort,
} from '../../ports/seo-brief-ai.port.js';
import {
  InMemorySeoBriefArtifactRepository,
  InMemorySeoBriefRunRepository,
  InMemorySeoBriefRunStepRepository,
} from '../../testing/run-test-harness.js';
import { CleanupLongreadArticleCommand } from './cleanup-longread-article.command.js';
import { CleanupLongreadArticleHandler } from './cleanup-longread-article.handler.js';

function createRun(): SeoBriefRun {
  return SeoBriefRun.create({
    topicSeed: 'USDT yield safety',
    country: 'United States',
    language: 'English',
    audience: 'US crypto users',
    productName: 'Reinforce',
    productDescription: 'Helps users compare ways to make idle USDT productive',
    brandMemorySnapshot: {
      brandName: 'Reinforce',
      productDescription: 'Helps users compare ways to make idle USDT productive',
      targetAudience: 'US crypto users',
      approvedFacts: ['Reinforce helps users compare USDT yield options.'],
      forbiddenClaims: ['guaranteed returns'],
      glossary: {},
      bannedPhrases: ['risk-free yield'],
      requiredPhrases: ['not financial advice'],
      brandDocs: [],
      adaptationPromptRules: null,
    },
  });
}

async function seedArticleInputs(
  artifactRepository: InMemorySeoBriefArtifactRepository,
  run: SeoBriefRun,
) {
  await artifactRepository.save(
    SeoBriefArtifact.create({
      runId: run.id,
      stage: 'brief_generation',
      artifactType: 'final_brief_snapshot',
      payload: {
        brief: {
          primaryKeyword: 'is USDT yield safe',
          searchIntent: 'informational',
          targetReader: 'US crypto users comparing USDT yield options',
          recommendedH1: 'Is USDT Yield Safe?',
          mainCluster: 'USDT yield safety',
          secondaryKeywords: ['USDT yield risk'],
          productInsertion: {
            where: 'Near the comparison section',
            how: 'Position Reinforce as one comparison path',
            sampleAngle: 'educational comparison',
          },
          riskNotes: ['Do not imply stablecoin yield is guaranteed or risk-free.'],
          outline: [
            { heading: 'What USDT yield means' },
            { heading: 'Key risks to understand' },
            { heading: 'How to compare options' },
          ],
        },
      },
    }),
  );
  await artifactRepository.save(
    SeoBriefArtifact.create({
      runId: run.id,
      stage: 'brief_generation',
      artifactType: 'longread_draft_article',
      payload: {
        artifactVersion: 'longread_draft_article_v1',
        draftArticleMarkdown: '# Is USDT Yield Safe?\n\nThis draft says yield is guaranteed.',
      },
    }),
  );
}

describe('CleanupLongreadArticleHandler', () => {
  it('rechecks a revised article with previous findings until it passes', async () => {
    const runRepository = new InMemorySeoBriefRunRepository();
    const stepRepository = new InMemorySeoBriefRunStepRepository();
    const artifactRepository = new InMemorySeoBriefArtifactRepository();
    const run = createRun();
    await runRepository.save(run);
    await seedArticleInputs(artifactRepository, run);
    const calls: CleanupLongreadArticleParams[] = [];
    const responses: AiCleanupLongreadArticleResult[] = [
      {
        status: 'revised',
        warnings: [
          {
            type: 'compliance',
            severity: 'warning',
            message: 'Guaranteed yield wording was removed.',
          },
        ],
        changesMade: ['Removed guaranteed yield wording.'],
        articleMarkdown: '# Is USDT Yield Safe?\n\nUSDT yield has risks.',
      },
      {
        status: 'passed',
        warnings: [],
        changesMade: ['Confirmed the revised article passes checks.'],
        articleMarkdown: '# Is USDT Yield Safe?\n\nUSDT yield has risks.',
      },
    ];
    const ai = {
      cleanupLongreadArticle: async (params: CleanupLongreadArticleParams) => {
        calls.push(params);
        return responses[calls.length - 1] ?? responses[responses.length - 1];
      },
    } as unknown as SeoBriefAiPort;
    const handler = new CleanupLongreadArticleHandler(
      runRepository,
      stepRepository,
      artifactRepository,
      ai,
    );

    const result = await handler.execute(new CleanupLongreadArticleCommand(run.id));
    const artifacts = await artifactRepository.findByRunId(run.id);
    const cleanupArtifact = artifacts.find(
      (artifact) => artifact.artifactType === 'longread_cleanup',
    )?.payload as {
      reviewAttempts: Array<{ status: string }>;
      status: string;
    };

    expect(result).toMatchObject({
      artifactType: 'longread_cleanup',
      attemptCount: 2,
      status: 'passed',
      warningCount: 0,
    });
    expect(calls).toHaveLength(2);
    expect(calls[1]?.draftArticleMarkdown).toContain('USDT yield has risks');
    expect(calls[1]?.previousReviewFindings?.[0]?.status).toBe('revised');
    expect(cleanupArtifact.status).toBe('passed');
    expect(cleanupArtifact.reviewAttempts).toHaveLength(2);
    expect((await runRepository.findById(run.id))?.status).toBe('awaiting_confirmation');
  });

  it('finalizes as passed with warnings when no blockers remain after max attempts', async () => {
    const runRepository = new InMemorySeoBriefRunRepository();
    const stepRepository = new InMemorySeoBriefRunStepRepository();
    const artifactRepository = new InMemorySeoBriefArtifactRepository();
    const run = createRun();
    await runRepository.save(run);
    await seedArticleInputs(artifactRepository, run);
    const ai = {
      cleanupLongreadArticle: async (): Promise<AiCleanupLongreadArticleResult> => ({
        status: 'revised',
        warnings: [
          {
            type: 'claims',
            severity: 'warning',
            message: 'A claim was softened and no longer blocks publication.',
          },
        ],
        changesMade: ['Softened one claim.'],
        articleMarkdown: '# Is USDT Yield Safe?\n\nSome claims still need checking.',
      }),
    } as unknown as SeoBriefAiPort;
    const handler = new CleanupLongreadArticleHandler(
      runRepository,
      stepRepository,
      artifactRepository,
      ai,
    );

    const result = await handler.execute(new CleanupLongreadArticleCommand(run.id));
    const storedRun = await runRepository.findById(run.id);

    expect(result).toMatchObject({
      attemptCount: 5,
      status: 'passed_with_warnings',
      warningCount: 1,
    });
    expect(storedRun?.status).toBe('awaiting_confirmation');
  });

  it('keeps retrying when the model asks for human review before the max attempt', async () => {
    const runRepository = new InMemorySeoBriefRunRepository();
    const stepRepository = new InMemorySeoBriefRunStepRepository();
    const artifactRepository = new InMemorySeoBriefArtifactRepository();
    const run = createRun();
    await runRepository.save(run);
    await seedArticleInputs(artifactRepository, run);
    const calls: CleanupLongreadArticleParams[] = [];
    const responses: AiCleanupLongreadArticleResult[] = [
      {
        status: 'needs_human_review',
        warnings: [
          {
            type: 'compliance',
            severity: 'blocker',
            message: 'The article still implies USDT yield is guaranteed.',
          },
        ],
        changesMade: ['Identified the blocked guarantee claim.'],
        articleMarkdown: '# Is USDT Yield Safe?\n\nUSDT yield is still described as guaranteed.',
      },
      {
        status: 'passed',
        warnings: [],
        changesMade: ['Removed the blocked guarantee claim.'],
        articleMarkdown: '# Is USDT Yield Safe?\n\nUSDT yield involves risks.',
      },
    ];
    const ai = {
      cleanupLongreadArticle: async (params: CleanupLongreadArticleParams) => {
        calls.push(params);
        return responses[calls.length - 1] ?? responses[responses.length - 1];
      },
    } as unknown as SeoBriefAiPort;
    const handler = new CleanupLongreadArticleHandler(
      runRepository,
      stepRepository,
      artifactRepository,
      ai,
    );

    const result = await handler.execute(new CleanupLongreadArticleCommand(run.id));
    const storedRun = await runRepository.findById(run.id);

    expect(result).toMatchObject({
      attemptCount: 2,
      status: 'passed',
      warningCount: 0,
    });
    expect(calls).toHaveLength(2);
    expect(calls[1]?.previousReviewFindings?.[0]?.status).toBe('needs_human_review');
    expect(storedRun?.status).toBe('awaiting_confirmation');
  });

  it('fails the run when blockers remain after max attempts', async () => {
    const runRepository = new InMemorySeoBriefRunRepository();
    const stepRepository = new InMemorySeoBriefRunStepRepository();
    const artifactRepository = new InMemorySeoBriefArtifactRepository();
    const run = createRun();
    await runRepository.save(run);
    await seedArticleInputs(artifactRepository, run);
    const ai = {
      cleanupLongreadArticle: async (): Promise<AiCleanupLongreadArticleResult> => ({
        status: 'revised',
        warnings: [
          {
            type: 'compliance',
            severity: 'blocker',
            message: 'The article still implies USDT yield is guaranteed.',
          },
        ],
        changesMade: ['Attempted to soften one compliance-sensitive claim.'],
        articleMarkdown: '# Is USDT Yield Safe?\n\nUSDT yield is still described as guaranteed.',
      }),
    } as unknown as SeoBriefAiPort;
    const handler = new CleanupLongreadArticleHandler(
      runRepository,
      stepRepository,
      artifactRepository,
      ai,
    );

    const result = await handler.execute(new CleanupLongreadArticleCommand(run.id));
    const storedRun = await runRepository.findById(run.id);

    expect(result).toMatchObject({
      attemptCount: 5,
      status: 'needs_human_review',
      warningCount: 1,
    });
    expect(storedRun?.status).toBe('failed');
    expect(storedRun?.failureReason).toContain('could not resolve 1 publish-blocking issue');
  });
});
