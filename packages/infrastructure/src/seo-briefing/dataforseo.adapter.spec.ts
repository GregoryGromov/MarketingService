import {
  type GetSearchVolumeParams,
  type SeoBriefExternalCallLog,
  type SeoBriefExternalCallLogId,
  type SeoBriefExternalCallLogRepository,
  type SeoBriefRunId,
  SeoResearchTransportError,
} from '@marketing-service/seo-briefing';
import type { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import { DataForSeoAdapter } from './dataforseo.adapter.js';
import {
  DataForSeoHttpClientPort,
  type DataForSeoHttpRequest,
  type DataForSeoHttpResponse,
} from './dataforseo-http-client.port.js';
import { DataForSeoMemoryCacheService } from './dataforseo-memory-cache.service.js';

class InMemorySeoBriefExternalCallLogRepository {
  readonly records = new Map<string, SeoBriefExternalCallLog>();

  findById(id: SeoBriefExternalCallLogId): Promise<SeoBriefExternalCallLog | null> {
    return Promise.resolve(this.records.get(id) ?? null);
  }

  findByRunId(runId: SeoBriefRunId): Promise<SeoBriefExternalCallLog[]> {
    return Promise.resolve([...this.records.values()].filter((record) => record.runId === runId));
  }

  save(log: SeoBriefExternalCallLog): Promise<void> {
    this.records.set(log.id, log);
    return Promise.resolve();
  }
}

class FakeConfigService {
  constructor(private readonly values: Record<string, string>) {}

  get<T = string>(key: string): T | undefined {
    return this.values[key] as T | undefined;
  }
}

class FakeDataForSeoHttpClient extends DataForSeoHttpClientPort {
  readonly requests: DataForSeoHttpRequest[] = [];

  constructor(
    private readonly queue: Array<
      { type: 'response'; value: DataForSeoHttpResponse } | { type: 'error'; value: Error }
    >,
  ) {
    super();
  }

  async request(request: DataForSeoHttpRequest): Promise<DataForSeoHttpResponse> {
    this.requests.push(request);
    const next = this.queue.shift();
    if (!next) {
      throw new Error('No queued fake DataForSEO response');
    }

    if (next.type === 'error') {
      throw next.value;
    }

    return next.value;
  }
}

function createAdapter(
  queue: Array<
    { type: 'response'; value: DataForSeoHttpResponse } | { type: 'error'; value: Error }
  >,
) {
  const client = new FakeDataForSeoHttpClient(queue);
  const repository = new InMemorySeoBriefExternalCallLogRepository();
  const adapter = new DataForSeoAdapter(
    new FakeConfigService({
      DATAFORSEO_CACHE_TTL_MS: '600000',
      DATAFORSEO_MAX_ATTEMPTS: '2',
      DATAFORSEO_ON_PAGE_POLL_ATTEMPTS: '2',
      DATAFORSEO_ON_PAGE_POLL_DELAY_MS: '0',
      DATAFORSEO_RETRY_DELAY_MS: '0',
      DATAFORSEO_TIMEOUT_MS: '1000',
    }) as unknown as ConfigService,
    client,
    new DataForSeoMemoryCacheService(),
    repository as SeoBriefExternalCallLogRepository,
  );

  return { adapter, client, repository };
}

function createSearchVolumeParams(): GetSearchVolumeParams {
  return {
    runId: 'seo_brief_run_1' as never,
    stepId: 'seo_brief_step_1' as never,
    keywords: ['USDT Yield', 'Passive Income with USDT'],
    market: {
      country: 'Nigeria',
      language: 'English',
      locationName: 'Lagos, Lagos, Nigeria',
    },
  };
}

describe('DataForSeoAdapter', () => {
  it('maps search volume responses and serves subsequent requests from cache', async () => {
    const { adapter, client, repository } = createAdapter([
      {
        type: 'response',
        value: {
          status: 200,
          payload: {
            tasks: [
              {
                cost: 0.05,
                status_code: 20000,
                result: [
                  {
                    items: [
                      {
                        keyword: 'usdt yield',
                        search_volume: 5400,
                        competition: 0.31,
                        cpc: 1.2,
                        low_top_of_page_bid: 0.8,
                        high_top_of_page_bid: 1.6,
                        monthly_searches: [
                          { year: 2026, month: 4, search_volume: 5100 },
                          { year: 2026, month: 5, search_volume: 5400 },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
    ]);

    const params = createSearchVolumeParams();
    const first = await adapter.getSearchVolume(params);
    const second = await adapter.getSearchVolume(params);
    const logs = await repository.findByRunId(params.runId);

    expect(client.requests).toHaveLength(1);
    expect(first).toEqual(second);
    expect(first.items[0]).toEqual({
      keyword: 'usdt yield',
      searchVolume: 5400,
      competition: 0.31,
      cpc: 1.2,
      lowTopBid: 0.8,
      highTopBid: 1.6,
      monthlySearches: [
        { year: 2026, month: 4, searchVolume: 5100 },
        { year: 2026, month: 5, searchVolume: 5400 },
      ],
    });
    expect(logs).toHaveLength(2);
    expect(logs[0]?.cacheHit).toBe(false);
    expect(logs[0]?.estimatedCost).toBe(0.05);
    expect(logs[1]?.cacheHit).toBe(true);
    expect(logs[1]?.estimatedCost).toBe(0);
  });

  it('retries retryable transport errors and then returns normalized serp results', async () => {
    const { adapter, client, repository } = createAdapter([
      {
        type: 'error',
        value: new SeoResearchTransportError(
          'temporary upstream failure',
          '/v3/serp/google/organic/live/advanced',
          'dataforseo',
          500,
        ),
      },
      {
        type: 'response',
        value: {
          status: 200,
          payload: {
            tasks: [
              {
                cost: 0.02,
                status_code: 20000,
                result: [
                  {
                    check_url: 'https://google.com/search?q=usdt+yield',
                    se_results_count: 123000,
                    items: [
                      {
                        type: 'organic',
                        rank_group: 1,
                        rank_absolute: 1,
                        title: 'USDT Yield Guide',
                        url: 'https://example.com/usdt-yield',
                        domain: 'example.com',
                        description: 'Learn how USDT yield works.',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
    ]);

    const result = await adapter.getOrganicSerp({
      runId: 'seo_brief_run_2' as never,
      keyword: 'USDT Yield',
      market: {
        country: 'Nigeria',
        language: 'English',
      },
    });
    const logs = await repository.findByRunId('seo_brief_run_2' as never);

    expect(client.requests).toHaveLength(2);
    expect(result.items).toEqual([
      {
        type: 'organic',
        rankGroup: 1,
        rankAbsolute: 1,
        title: 'USDT Yield Guide',
        url: 'https://example.com/usdt-yield',
        domain: 'example.com',
        description: 'Learn how USDT yield works.',
      },
    ]);
    expect(logs).toHaveLength(1);
    expect(logs[0]?.status).toBe('completed');
    expect(logs[0]?.cacheHit).toBe(false);
  });

  it('normalizes language aliases before sending SERP requests to DataForSEO', async () => {
    const { adapter, client } = createAdapter([
      {
        type: 'response',
        value: {
          status: 200,
          payload: {
            tasks: [
              {
                cost: 0.002,
                status_code: 20000,
                result: [
                  {
                    keyword: 'usdt',
                    location_name: 'Nigeria',
                    language_name: 'English',
                    language_code: 'en',
                    device: 'mobile',
                    os: 'android',
                    item_types: [],
                    items: [],
                  },
                ],
              },
            ],
          },
        },
      },
    ]);

    await adapter.getOrganicSerpSnapshot({
      runId: 'seo_brief_run_5' as never,
      keyword: 'USDT',
      market: {
        country: 'Nigeria',
        language: 'Nigerian English',
      },
    });

    expect(client.requests[0]?.payload).toMatchObject({
      language_code: 'en',
      language_name: 'English',
      location_name: 'Nigeria',
    });
  });

  it.each([
    ['Pidgin', 'pcm'],
    ['Hausa', 'ha'],
    ['Punjabi', 'pa'],
    ['Pashto', 'ps'],
    ['Xhosa', 'xh'],
    ['Igbo', 'ig'],
    ['Romanian', 'ro'],
  ])('normalizes %s before sending SERP requests to DataForSEO', async (language, code) => {
    const { adapter, client } = createAdapter([
      {
        type: 'response',
        value: {
          status: 200,
          payload: {
            tasks: [
              {
                cost: 0.002,
                status_code: 20000,
                result: [
                  {
                    keyword: 'usdt',
                    location_name: 'Nigeria',
                    language_name: language,
                    language_code: code,
                    device: 'mobile',
                    os: 'android',
                    item_types: [],
                    items: [],
                  },
                ],
              },
            ],
          },
        },
      },
    ]);

    await adapter.getOrganicSerpSnapshot({
      runId: 'seo_brief_run_language' as never,
      keyword: 'USDT',
      market: {
        country: 'Nigeria',
        language,
      },
    });

    expect(client.requests[0]?.payload).toMatchObject({
      language_code: code,
      language_name: language,
      location_name: 'Nigeria',
    });
  });

  it('maps a normalized serp snapshot with organic, paa, related searches, and special blocks', async () => {
    const { adapter, client, repository } = createAdapter([
      {
        type: 'response',
        value: {
          status: 200,
          payload: {
            tasks: [
              {
                cost: 0.002,
                status_code: 20000,
                result: [
                  {
                    keyword: 'usdt',
                    location_name: 'Nigeria',
                    location_code: 2566,
                    language_name: 'English',
                    language_code: 'en',
                    device: 'mobile',
                    os: 'android',
                    datetime: '2026-05-31 20:20:04 +00:00',
                    check_url: 'https://www.google.com/search?q=usdt',
                    item_types: [
                      'ai_overview',
                      'stocks_box',
                      'people_also_ask',
                      'organic',
                      'people_also_search',
                    ],
                    items: [
                      {
                        type: 'ai_overview',
                        markdown:
                          'You can earn USDT through savings accounts, microtasks, referral programs, or trading.',
                        items: [
                          {
                            type: 'ai_overview_element',
                            text: 'You can earn USDT through savings accounts or rewards.',
                            links: [
                              {
                                domain: 'trustwallet.com',
                                url: 'https://trustwallet.com/stablecoin-earn/usdt',
                                title: 'Earn USDT Rewards - Trust Wallet',
                              },
                            ],
                          },
                        ],
                        references: [
                          {
                            domain: 'www.binance.com',
                            url: 'https://www.binance.com/en/earn/USDT',
                            title: 'How To Earn With USDT - Binance',
                            text: 'Binance Earn provides USDT earning options.',
                            source: 'Binance',
                          },
                        ],
                      },
                      {
                        type: 'stocks_box',
                        title: 'Market Summary > Tether',
                        price: '1,370.40',
                        currency: 'Nigerian Naira',
                      },
                      {
                        type: 'people_also_ask',
                        items: [
                          {
                            type: 'people_also_ask_element',
                            title: 'What exactly is the USDT?',
                            expanded_element: [
                              {
                                domain: 'www.binance.com',
                                url: 'https://www.binance.com/en/academy/articles/what-is-tether-usdt',
                                title: 'What Is Tether (USDT)? - Binance',
                                description:
                                  'Tether (USDT) is a stablecoin designed to be pegged to the US dollar.',
                              },
                            ],
                          },
                          {
                            type: 'people_also_ask_element',
                            title: 'How can I earn free USDT?',
                            expanded_element: [
                              {
                                type: 'people_also_ask_ai_overview_expanded_element',
                                asynchronous_ai_overview: true,
                              },
                            ],
                          },
                        ],
                      },
                      {
                        type: 'organic',
                        rank_group: 1,
                        rank_absolute: 5,
                        title: 'What Is Tether (USDT)? - Binance',
                        url: 'https://www.binance.com/en/academy/articles/what-is-tether-usdt',
                        domain: 'www.binance.com',
                        description:
                          'Tether (USDT) is a stablecoin designed to be pegged 1-to-1 to the US dollar.',
                        extended_people_also_search: [
                          'People also search for',
                          'USDT to naira',
                          'USDT wallet',
                        ],
                      },
                      {
                        type: 'people_also_search',
                        title: 'People also search for',
                        items: [{ title: 'USDT to naira' }, { title: 'USDT wallet' }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
    ]);

    const result = await adapter.getOrganicSerpSnapshot({
      runId: 'seo_brief_run_4' as never,
      keyword: 'USDT',
      market: {
        country: 'Nigeria',
        language: 'English',
      },
    });
    const logs = await repository.findByRunId('seo_brief_run_4' as never);

    expect(client.requests).toHaveLength(1);
    expect(result.snapshot).toEqual({
      keyword: 'usdt',
      locationName: 'Nigeria',
      locationCode: 2566,
      languageName: 'English',
      languageCode: 'en',
      device: 'mobile',
      os: 'android',
      datetime: '2026-05-31 20:20:04 +00:00',
      checkUrl: 'https://www.google.com/search?q=usdt',
      cost: 0.002,
      serpFeatures: [
        'ai_overview',
        'stocks_box',
        'people_also_ask',
        'organic',
        'people_also_search',
      ],
      aiOverview: {
        text: 'You can earn USDT through savings accounts, microtasks, referral programs, or trading.',
        elements: [
          {
            text: 'You can earn USDT through savings accounts or rewards.',
            title: null,
            links: [
              {
                domain: 'trustwallet.com',
                url: 'https://trustwallet.com/stablecoin-earn/usdt',
                title: 'Earn USDT Rewards - Trust Wallet',
                snippet: null,
                source: null,
              },
            ],
          },
        ],
        references: [
          {
            domain: 'www.binance.com',
            url: 'https://www.binance.com/en/earn/USDT',
            title: 'How To Earn With USDT - Binance',
            snippet: 'Binance Earn provides USDT earning options.',
            source: 'Binance',
          },
          {
            domain: 'trustwallet.com',
            url: 'https://trustwallet.com/stablecoin-earn/usdt',
            title: 'Earn USDT Rewards - Trust Wallet',
            snippet: null,
            source: null,
          },
        ],
      },
      organicResults: [
        {
          position: 1,
          rankGroup: 1,
          rankAbsolute: 5,
          domain: 'www.binance.com',
          url: 'https://www.binance.com/en/academy/articles/what-is-tether-usdt',
          title: 'What Is Tether (USDT)? - Binance',
          snippet: 'Tether (USDT) is a stablecoin designed to be pegged 1-to-1 to the US dollar.',
        },
      ],
      peopleAlsoAsk: [
        {
          question: 'What exactly is the USDT?',
          sourceDomain: 'www.binance.com',
          sourceUrl: 'https://www.binance.com/en/academy/articles/what-is-tether-usdt',
          sourceTitle: 'What Is Tether (USDT)? - Binance',
          answerSnippet: 'Tether (USDT) is a stablecoin designed to be pegged to the US dollar.',
        },
        {
          question: 'How can I earn free USDT?',
          sourceDomain: null,
          sourceUrl: null,
          sourceTitle: null,
          answerSnippet: null,
        },
      ],
      relatedSearches: ['USDT to naira', 'USDT wallet'],
      specialBlocks: [
        {
          type: 'ai_overview',
          title: 'How To Earn With USDT - Binance',
          subtitle:
            'You can earn USDT through savings accounts, microtasks, referral programs, or trading.',
          displayedPrice: null,
          currencyContext: null,
          sourceDomain: 'www.binance.com',
        },
        {
          type: 'stocks_box',
          title: 'Market Summary > Tether',
          subtitle: null,
          displayedPrice: '1,370.40',
          currencyContext: 'Nigerian Naira',
          sourceDomain: null,
        },
      ],
    });
    expect(logs).toHaveLength(1);
    expect(logs[0]?.status).toBe('completed');
  });

  it('fetches ranked keywords with the configured DataForSEO Labs payload and normalizes keyword evidence', async () => {
    const { adapter, client } = createAdapter([
      {
        type: 'response',
        value: {
          status: 200,
          payload: {
            tasks: [
              {
                cost: 0.01,
                status_code: 20000,
                result: [
                  {
                    target: 'trustwallet.com',
                    total_count: 1000,
                    items_count: 1,
                    metrics: {
                      organic: {
                        pos_1: 2,
                        pos_2_3: 4,
                        pos_4_10: 12,
                        etv: 55.5,
                      },
                    },
                    items: [
                      {
                        keyword_data: {
                          keyword: 'how to use trust wallet',
                          keyword_info: {
                            search_volume: 170,
                            cpc: 0.4,
                            competition_level: 'LOW',
                            monthly_searches: [{ year: 2026, month: 5, search_volume: 170 }],
                          },
                          keyword_properties: {
                            keyword_difficulty: 8,
                          },
                          search_intent_info: {
                            main_intent: 'informational',
                          },
                          serp_info: {
                            serp_item_types: ['organic', 'people_also_ask', 'organic'],
                          },
                        },
                        ranked_serp_element: {
                          serp_item: {
                            domain: 'www.trustwallet.com',
                            url: 'https://trustwallet.com/blog/how-to-use',
                            title: 'How to Use Trust Wallet',
                            rank_absolute: 3,
                            etv: 51.68,
                          },
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
    ]);

    const result = await adapter.getRankedKeywords({
      runId: 'seo_brief_run_ranked' as never,
      target: 'TrustWallet.com',
      market: {
        country: 'Nigeria',
        language: 'English',
      },
    });

    expect(client.requests[0]?.path).toBe('/v3/dataforseo_labs/google/ranked_keywords/live');
    expect(client.requests[0]?.payload).toMatchObject({
      target: 'trustwallet.com',
      location_name: 'Nigeria',
      language_code: 'en',
      language_name: 'English',
      limit: 100,
      historical_serp_mode: 'live',
      load_rank_absolute: false,
      ignore_synonyms: false,
      include_clickstream_data: false,
    });
    expect(result).toMatchObject({
      provider: 'dataforseo',
      target: 'trustwallet.com',
      totalCount: 1000,
      itemsCount: 1,
      metrics: {
        organicPos1: 2,
        organicPos2To3: 4,
        organicPos4To10: 12,
        organicEtv: 55.5,
      },
      items: [
        {
          text: 'how to use trust wallet',
          type: 'keyword',
          source: 'ranked_keywords',
          sourceDomain: 'trustwallet.com',
          metrics: {
            searchVolume: 170,
            searchVolumeSource: 'ranked_keywords',
            keywordDifficulty: 8,
            cpc: 0.4,
            competitionLevel: 'LOW',
            intent: 'informational',
            monthlySearches: [{ year: 2026, month: 5, searchVolume: 170 }],
          },
          competitorEvidence: {
            domain: 'trustwallet.com',
            rankingUrl: 'https://trustwallet.com/blog/how-to-use',
            rankingTitle: 'How to Use Trust Wallet',
            rankAbsolute: 3,
            estimatedTraffic: 51.68,
          },
          serpEvidence: {
            serpFeatures: ['organic', 'people_also_ask'],
          },
        },
      ],
    });
  });

  it('posts an on-page task, polls summary, and normalizes the final result', async () => {
    const { adapter, client, repository } = createAdapter([
      {
        type: 'response',
        value: {
          status: 200,
          payload: {
            tasks: [
              {
                id: 'dfs-task-1',
                cost: 0.03,
                status_code: 20000,
                result: [{}],
              },
            ],
          },
        },
      },
      {
        type: 'response',
        value: {
          status: 200,
          payload: {
            tasks: [
              {
                cost: 0,
                status_code: 20000,
                result: [
                  {
                    crawl_progress: 'finished',
                    onpage_score: 77.5,
                    total_pages: 1,
                    checks: {
                      is_broken: 0,
                      duplicate_title: 0,
                      duplicate_description: 1,
                    },
                  },
                ],
              },
            ],
          },
        },
      },
    ]);

    const result = await adapter.getOnPageParse({
      runId: 'seo_brief_run_3' as never,
      target: 'https://example.com/usdt-yield',
      maxCrawlPages: 1,
      enableJavascript: true,
    });
    const logs = await repository.findByRunId('seo_brief_run_3' as never);

    expect(client.requests).toHaveLength(2);
    expect(result).toEqual({
      provider: 'dataforseo',
      providerTaskId: 'dfs-task-1',
      target: 'https://example.com/usdt-yield',
      crawlProgress: 'finished',
      onpageScore: 77.5,
      pageCount: 1,
      brokenPages: 0,
      duplicateTitlePages: 0,
      duplicateDescriptionPages: 1,
    });
    expect(logs).toHaveLength(2);
    expect(logs.map((log) => log.endpoint)).toEqual([
      '/v3/on_page/task_post',
      '/v3/on_page/summary/dfs-task-1',
    ]);
  });

  it('fetches live content parsing and instant page metadata for on-page URLs', async () => {
    const { adapter, client, repository } = createAdapter([
      {
        type: 'response',
        value: {
          status: 200,
          payload: {
            tasks: [
              {
                id: 'content-task-1',
                cost: 0.02,
                status_code: 20000,
                result: [
                  {
                    page: {
                      title: 'Earn USDT Rewards',
                      content: {
                        headings: {
                          h1: ['Earn USDT Rewards'],
                          h2: ['How USDT earn works', 'Risks to understand'],
                          h3: ['Flexible access'],
                        },
                        markdown: '# Earn USDT Rewards',
                        text_blocks: [
                          'Earn rewards on your USDT holdings.',
                          'Understand the risks.',
                        ],
                        tables: [{ rows: 2 }],
                        links: [
                          {
                            url: 'https://example.com/risk',
                            anchor: 'Risk disclosure',
                          },
                        ],
                      },
                    },
                  },
                ],
              },
            ],
          },
        },
      },
      {
        type: 'response',
        value: {
          status: 200,
          payload: {
            tasks: [
              {
                id: 'instant-task-1',
                cost: 0.01,
                status_code: 20000,
                result: [
                  {
                    title: 'Earn USDT Rewards',
                    meta_description: 'Earn rewards with clear risk information.',
                    canonical: 'https://trustwallet.com/stablecoin-earn/usdt',
                    status_code: 200,
                    checks: {
                      is_https: true,
                    },
                  },
                ],
              },
            ],
          },
        },
      },
    ]);

    const content = await adapter.getOnPageContentParsing({
      runId: 'seo_brief_run_4' as never,
      url: 'https://trustwallet.com/stablecoin-earn/usdt',
      markdownView: true,
    });
    const instant = await adapter.getOnPageInstantPages({
      runId: 'seo_brief_run_4' as never,
      url: 'https://trustwallet.com/stablecoin-earn/usdt',
    });
    const logs = await repository.findByRunId('seo_brief_run_4' as never);

    expect(client.requests.map((request) => request.path)).toEqual([
      '/v3/on_page/content_parsing/live',
      '/v3/on_page/instant_pages',
    ]);
    expect(client.requests[0]?.payload).toEqual({
      url: 'https://trustwallet.com/stablecoin-earn/usdt',
      markdown_view: true,
    });
    expect(content).toMatchObject({
      provider: 'dataforseo',
      url: 'https://trustwallet.com/stablecoin-earn/usdt',
      title: 'Earn USDT Rewards',
      h1: ['Earn USDT Rewards'],
      h2: ['How USDT earn works', 'Risks to understand'],
      h3: ['Flexible access'],
      markdown: '# Earn USDT Rewards',
      textBlocks: ['Earn rewards on your USDT holdings.', 'Understand the risks.'],
      links: [
        {
          url: 'https://example.com/risk',
          anchor: 'Risk disclosure',
        },
      ],
    });
    expect(instant).toMatchObject({
      provider: 'dataforseo',
      url: 'https://trustwallet.com/stablecoin-earn/usdt',
      title: 'Earn USDT Rewards',
      metaDescription: 'Earn rewards with clear risk information.',
      canonical: 'https://trustwallet.com/stablecoin-earn/usdt',
      statusCode: 200,
      technicalChecks: {
        is_https: true,
      },
    });
    expect(logs.map((log) => log.endpoint)).toEqual([
      '/v3/on_page/content_parsing/live',
      '/v3/on_page/instant_pages',
    ]);
  });
});
