import { describe, expect, it } from 'vitest';
import {
  type SelectRelatedKeywordsParams,
  type SelectRelatedKeywordsResult,
  type SeoBriefAiPort,
  SeoBriefArtifact,
  SeoBriefRun,
  SeoBriefSerpDerivedKeywordsNotFoundError,
} from '../../index.js';
import {
  InMemorySeoBriefArtifactRepository,
  InMemorySeoBriefRunRepository,
} from '../../testing/run-test-harness.js';
import { SelectFirstKeywordRelatedQueriesCommand } from './select-first-keyword-related-queries.command.js';
import { SelectFirstKeywordRelatedQueriesHandler } from './select-first-keyword-related-queries.handler.js';

function createRun(): SeoBriefRun {
  return SeoBriefRun.create({
    topicSeed: 'what is USDT',
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
}

function createHandler(params?: {
  aiResult?: SelectRelatedKeywordsResult;
  runRepository?: InMemorySeoBriefRunRepository;
  artifactRepository?: InMemorySeoBriefArtifactRepository;
}) {
  const runRepository = params?.runRepository ?? new InMemorySeoBriefRunRepository();
  const artifactRepository = params?.artifactRepository ?? new InMemorySeoBriefArtifactRepository();
  const aiCalls: SelectRelatedKeywordsParams[] = [];
  const ai = {
    selectRelatedKeywords(input: SelectRelatedKeywordsParams) {
      aiCalls.push(input);

      return Promise.resolve(
        params?.aiResult ?? {
          selected: [],
          rejected: [],
        },
      );
    },
  } as unknown as SeoBriefAiPort;

  return {
    aiCalls,
    artifactRepository,
    handler: new SelectFirstKeywordRelatedQueriesHandler(runRepository, artifactRepository, ai),
    runRepository,
  };
}

describe('SelectFirstKeywordRelatedQueriesHandler', () => {
  it('selects only grounded related queries from the saved SERP-derived candidates', async () => {
    const run = createRun();
    const { aiCalls, artifactRepository, handler, runRepository } = createHandler({
      aiResult: {
        selected: [
          {
            keyword: 'What is USDT used for?',
            source: 'people_also_ask',
            sourceText: 'What is USDT used for?',
            reason: 'Complete natural query from PAA.',
          },
          {
            keyword: 'invented usdt query',
            source: 'related_search',
            sourceText: 'invented usdt query',
            reason: 'This should be removed by grounding validation.',
          },
          {
            keyword: 'is usdt safe',
            source: 'related_search',
            sourceText: 'is usdt safe',
            reason: 'Useful safety query.',
          },
        ],
        rejected: [
          {
            query: 'what is',
            reason: 'Fragment.',
          },
        ],
      },
    });
    await runRepository.save(run);
    await artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id,
        stage: 'keyword_expansion',
        artifactType: 'first_keyword_serp_derived_keywords',
        payload: {
          keyword: 'what is USDT',
          similarSearchQueries: [
            {
              query: 'What is USDT used for?',
              reason: 'Direct question from the People Also Ask SERP block.',
              source: 'people_also_ask',
              sourceText: 'What is USDT used for?',
            },
            {
              query: 'is usdt safe',
              reason: 'Visible related search query from the SERP.',
              source: 'related_search',
              sourceText: 'is usdt safe',
            },
          ],
        },
      }),
    );

    const result = await handler.execute(new SelectFirstKeywordRelatedQueriesCommand(run.id));
    const artifacts = await artifactRepository.findByRunId(run.id);
    const selection = artifacts.find(
      (artifact) => artifact.artifactType === 'first_keyword_related_query_selection',
    );

    expect(aiCalls).toHaveLength(1);
    expect(aiCalls[0]?.seedKeyword).toBe('what is USDT');
    expect(aiCalls[0]?.limit).toBe(3);
    expect(result.selectedCount).toBe(2);
    expect(selection?.payload).toMatchObject({
      keyword: 'what is USDT',
      selected: [
        {
          keyword: 'What is USDT used for',
          source: 'people_also_ask',
          sourceText: 'What is USDT used for?',
        },
        {
          keyword: 'is usdt safe',
          source: 'related_search',
          sourceText: 'is usdt safe',
        },
      ],
    });
    expect(JSON.stringify(selection?.payload)).not.toContain('invented usdt query');
  });

  it('fails when the SERP-derived candidate artifact is missing', async () => {
    const run = createRun();
    const { handler, runRepository } = createHandler();
    await runRepository.save(run);

    await expect(
      handler.execute(new SelectFirstKeywordRelatedQueriesCommand(run.id)),
    ).rejects.toBeInstanceOf(SeoBriefSerpDerivedKeywordsNotFoundError);
  });
});
