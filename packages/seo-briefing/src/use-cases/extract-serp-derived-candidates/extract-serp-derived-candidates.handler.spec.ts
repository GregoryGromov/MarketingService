import { describe, expect, it } from 'vitest';
import { SeoBriefArtifact, SeoBriefRun } from '../../index.js';
import {
  InMemorySeoBriefArtifactRepository,
  InMemorySeoBriefRunRepository,
} from '../../testing/run-test-harness.js';
import { ExtractSerpDerivedCandidatesCommand } from './extract-serp-derived-candidates.command.js';
import { ExtractSerpDerivedCandidatesHandler } from './extract-serp-derived-candidates.handler.js';

function createRun(): SeoBriefRun {
  return SeoBriefRun.create({
    topicSeed: 'usdt earn',
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

describe('ExtractSerpDerivedCandidatesHandler', () => {
  it('extracts grounded SERP candidates from saved normalized snapshots', async () => {
    const runRepository = new InMemorySeoBriefRunRepository();
    const artifactRepository = new InMemorySeoBriefArtifactRepository();
    const run = createRun();
    await runRepository.save(run);
    await artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id,
        stage: 'keyword_expansion',
        artifactType: 'keyword_serp_preview_snapshots',
        payload: {
          items: [
            {
              index: 0,
              keyword: 'earn usdt',
              snapshot: {
                keyword: 'earn usdt',
                serpFeatures: ['organic', 'people_also_ask', 'ai_overview'],
                peopleAlsoAsk: [{ question: 'How does earn usdt work?' }],
                relatedSearches: ['earn usdt basics'],
                aiOverview: {
                  elements: [{ text: 'Users can earn USDT through savings products.' }],
                },
                organicResults: [
                  {
                    position: 1,
                    domain: 'example.com',
                    url: 'https://example.com',
                    title: 'Earn USDT guide',
                    snippet: 'Compare flexible and locked USDT earning products.',
                  },
                ],
                specialBlocks: [],
              },
            },
          ],
        },
      }),
    );
    const handler = new ExtractSerpDerivedCandidatesHandler(runRepository, artifactRepository);

    const result = await handler.execute(new ExtractSerpDerivedCandidatesCommand(run.id));
    const artifacts = await artifactRepository.findByRunId(run.id);
    const derived = artifacts.find(
      (artifact) => artifact.artifactType === 'keyword_serp_derived_keywords',
    )?.payload as {
      items?: Array<{
        keyword: string;
        serpThemes: Array<{ theme: string }>;
        similarSearchQueries: Array<{ query: string }>;
      }>;
    };

    expect(result.keywordCount).toBe(1);
    expect(result.candidateQueryCount).toBe(2);
    expect(result.themeCount).toBe(3);
    expect(derived?.items?.[0]?.similarSearchQueries).toEqual([
      {
        query: 'How does earn usdt work',
        reason: 'Direct question from the People Also Ask SERP block.',
        source: 'people_also_ask',
        sourceText: 'How does earn usdt work?',
      },
      {
        query: 'earn usdt basics',
        reason: 'Visible related search query from the SERP.',
        source: 'related_search',
        sourceText: 'earn usdt basics',
      },
    ]);
    expect(derived?.items?.[0]?.serpThemes.map((item) => item.theme)).toContain('Earn USDT guide');
  });
});
