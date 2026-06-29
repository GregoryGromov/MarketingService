import { describe, expect, it } from 'vitest';
import {
  type ClassifySerpDomainsResult as AiClassifySerpDomainsResult,
  type ClassifySerpDomainsParams,
  SeoBriefAiPort,
  SeoBriefArtifact,
  SeoBriefRun,
} from '../../index.js';
import {
  InMemorySeoBriefArtifactRepository,
  InMemorySeoBriefRunRepository,
  InMemorySeoBriefRunStepRepository,
} from '../../testing/run-test-harness.js';
import { ClassifySerpDomainsCommand } from './classify-serp-domains.command.js';
import { ClassifySerpDomainsHandler } from './classify-serp-domains.handler.js';

class FakeSeoBriefAiPort extends SeoBriefAiPort {
  params: ClassifySerpDomainsParams | null = null;

  extractContext(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  extractUserPainScenarios(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  expandKeywords(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  triageKeywords(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  clusterKeywords(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  selectRelatedKeywords(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  classifySerpDomains(params: ClassifySerpDomainsParams): Promise<AiClassifySerpDomainsResult> {
    this.params = params;
    return Promise.resolve({
      rankedKeywordsTargets: [
        {
          domain: 'binance.com',
          domainType: 'cex_p2p',
          priority: 'high',
          reason:
            'Appears across multiple target queries and represents a relevant CEX/P2P competitor.',
        },
        {
          domain: 'trustwallet.com',
          domainType: 'wallet',
          priority: 'high',
          reason: 'Wallet domain with relevant stablecoin earning pages.',
        },
      ],
      onpageOnlyTargets: [
        {
          domain: 'nairametrics.com',
          domainType: 'media',
          reason: 'Useful editorial page pattern, but not a product keyword universe target.',
        },
      ],
      painSignalTargets: [
        {
          domain: 'reddit.com',
          domainType: 'forum',
          reason: 'Forum signal for user anxiety and objections.',
        },
      ],
      ignoredTargets: [
        {
          domain: 'youtube.com',
          reason: 'Video format signal, not a domain to query with ranked_keywords.',
        },
      ],
    });
  }

  scoreDirtyKeywordCandidates(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  buildProductBridge(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  explainClusterSelection(): Promise<never> {
    throw new Error('Not implemented in test');
  }

  generateSeoBrief(): Promise<never> {
    throw new Error('Not implemented in test');
  }
}

function createRun(): SeoBriefRun {
  return SeoBriefRun.create({
    topicSeed: 'earn yield on idle USDT',
    country: 'Nigeria',
    language: 'English',
    audience: 'Nigerian USDT holders',
    productName: 'Reinforce',
    productDescription: 'Helps users make idle USDT productive',
    brandMemorySnapshot: {
      brandName: 'Reinforce',
      productDescription: 'Helps users make idle USDT productive',
      targetAudience: 'Nigerian USDT holders',
      approvedFacts: [],
      forbiddenClaims: ['guaranteed returns'],
      glossary: {},
      bannedPhrases: [],
      requiredPhrases: [],
      brandDocs: [],
      adaptationPromptRules: null,
    },
  });
}

describe('ClassifySerpDomainsHandler', () => {
  it('classifies aggregated SERP domains and stores a domain classification artifact', async () => {
    const runRepository = new InMemorySeoBriefRunRepository();
    const stepRepository = new InMemorySeoBriefRunStepRepository();
    const artifactRepository = new InMemorySeoBriefArtifactRepository();
    const ai = new FakeSeoBriefAiPort();
    const run = createRun();
    await runRepository.save(run);
    await artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id,
        stage: 'created',
        artifactType: 'normalized_input',
        payload: {
          aiModelMode: 'pro',
        },
      }),
    );
    await artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id,
        stage: 'keyword_expansion',
        artifactType: 'user_pain_scenarios',
        payload: {
          topicHintInterpretation: 'Users want low-hype ways to compare USDT earning options.',
          userPains: [],
          userScenarios: [],
          riskNotes: ['Do not promise guaranteed returns.'],
        },
      }),
    );
    await artifactRepository.save(
      SeoBriefArtifact.create({
        runId: run.id,
        stage: 'serp_research',
        artifactType: 'serp_domain_aggregation',
        payload: {
          artifactVersion: 'serp_domain_aggregation_v1',
          domains: [
            { domain: 'binance.com', appearances: 3, best_rank: 1 },
            { domain: 'trustwallet.com', appearances: 2, best_rank: 2 },
            { domain: 'nairametrics.com', appearances: 1, best_rank: 4 },
            { domain: 'reddit.com', appearances: 1, best_rank: null },
            { domain: 'youtube.com', appearances: 1, best_rank: null },
          ],
          formatSignals: [],
        },
      }),
    );

    const handler = new ClassifySerpDomainsHandler(
      runRepository,
      stepRepository,
      artifactRepository,
      ai,
    );

    const result = await handler.execute(new ClassifySerpDomainsCommand(run.id));
    const artifacts = await artifactRepository.findByRunId(run.id);
    const saved = artifacts.find(
      (artifact) => artifact.artifactType === 'serp_domain_classification',
    );

    expect(ai.params?.modelMode).toBe('pro');
    expect(ai.params?.serpDomainAggregation.domains).toHaveLength(5);
    expect(result).toMatchObject({
      artifactType: 'serp_domain_classification',
      rankedKeywordsTargetCount: 2,
      onpageOnlyTargetCount: 1,
      painSignalTargetCount: 1,
      ignoredTargetCount: 1,
    });
    expect(saved?.payload).toMatchObject({
      artifactVersion: 'serp_domain_classification_v1',
      sourceArtifactType: 'serp_domain_aggregation',
      rankedKeywordsTargets: [
        {
          domain: 'binance.com',
          domainType: 'cex_p2p',
          priority: 'high',
        },
        {
          domain: 'trustwallet.com',
          domainType: 'wallet',
          priority: 'high',
        },
      ],
      onpageOnlyTargets: [
        {
          domain: 'nairametrics.com',
          domainType: 'media',
        },
      ],
      painSignalTargets: [
        {
          domain: 'reddit.com',
          domainType: 'forum',
        },
      ],
      ignoredTargets: [
        {
          domain: 'youtube.com',
        },
      ],
    });
  });
});
