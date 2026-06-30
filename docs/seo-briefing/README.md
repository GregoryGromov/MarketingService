# SEO Briefing Docs

Этот каталог содержит детальную документацию по разработке модуля `seo-briefing`.

Порядок чтения:

1. [00_ARCHITECTURE_RU.md](/Users/grigorijgromov/Desktop/Overnight/Projects/MarketingService/marketing-service/docs/seo-briefing/00_ARCHITECTURE_RU.md)
2. [01_PHASE_0_BOUNDARIES_RU.md](/Users/grigorijgromov/Desktop/Overnight/Projects/MarketingService/marketing-service/docs/seo-briefing/01_PHASE_0_BOUNDARIES_RU.md)
3. [02_PHASE_1_MODULE_SHELL_RU.md](/Users/grigorijgromov/Desktop/Overnight/Projects/MarketingService/marketing-service/docs/seo-briefing/02_PHASE_1_MODULE_SHELL_RU.md)
4. [03_PHASE_2_DATA_MODEL_RU.md](/Users/grigorijgromov/Desktop/Overnight/Projects/MarketingService/marketing-service/docs/seo-briefing/03_PHASE_2_DATA_MODEL_RU.md)
5. [04_PHASE_3_OBSERVABILITY_RU.md](/Users/grigorijgromov/Desktop/Overnight/Projects/MarketingService/marketing-service/docs/seo-briefing/04_PHASE_3_OBSERVABILITY_RU.md)
6. [05_PHASE_4_INPUT_AND_BRAND_MEMORY_RU.md](/Users/grigorijgromov/Desktop/Overnight/Projects/MarketingService/marketing-service/docs/seo-briefing/05_PHASE_4_INPUT_AND_BRAND_MEMORY_RU.md)
7. [06_PHASE_5_DATAFORSEO_FOUNDATION_RU.md](/Users/grigorijgromov/Desktop/Overnight/Projects/MarketingService/marketing-service/docs/seo-briefing/06_PHASE_5_DATAFORSEO_FOUNDATION_RU.md)
8. [07_PHASE_6_LLM_FOUNDATION_RU.md](/Users/grigorijgromov/Desktop/Overnight/Projects/MarketingService/marketing-service/docs/seo-briefing/07_PHASE_6_LLM_FOUNDATION_RU.md)
9. [08_PHASE_7_RESEARCH_PIPELINE_V1_RU.md](/Users/grigorijgromov/Desktop/Overnight/Projects/MarketingService/marketing-service/docs/seo-briefing/08_PHASE_7_RESEARCH_PIPELINE_V1_RU.md)
10. [09_PHASE_8_SERP_AND_ONPAGE_RU.md](/Users/grigorijgromov/Desktop/Overnight/Projects/MarketingService/marketing-service/docs/seo-briefing/09_PHASE_8_SERP_AND_ONPAGE_RU.md)
11. [10_PHASE_9_CLUSTERING_AND_SCORING_RU.md](/Users/grigorijgromov/Desktop/Overnight/Projects/MarketingService/marketing-service/docs/seo-briefing/10_PHASE_9_CLUSTERING_AND_SCORING_RU.md)
12. [11_PHASE_10_BRIEF_GENERATION_RU.md](/Users/grigorijgromov/Desktop/Overnight/Projects/MarketingService/marketing-service/docs/seo-briefing/11_PHASE_10_BRIEF_GENERATION_RU.md)
13. [12_PHASE_11_UI_RERUNS_HARDENING_RU.md](/Users/grigorijgromov/Desktop/Overnight/Projects/MarketingService/marketing-service/docs/seo-briefing/12_PHASE_11_UI_RERUNS_HARDENING_RU.md)
14. [13_FALLBACK_AND_RERUN_POLICY_RU.md](/Users/grigorijgromov/Desktop/Overnight/Projects/MarketingService/marketing-service/docs/seo-briefing/13_FALLBACK_AND_RERUN_POLICY_RU.md)

## Как этим пользоваться

Каждый phase-файл это самостоятельная инструкция для AI агента или разработчика.

В каждом файле есть:

- цель фазы;
- почему фаза идет именно здесь;
- что входит в scope;
- какие файлы и директории трогать;
- что должно получиться на выходе;
- что пока нельзя делать;
- exit criteria.

## Базовые правила для AI агента

1. Перед началом любой фазы сначала прочитать `00_ARCHITECTURE_RU.md`.
2. Не перескакивать через фазу, если не выполнены `Exit Criteria`.
3. Не начинать глубокий кодинг без observability hooks.
4. Не тянуть `Project` aggregate внутрь `seo-briefing`.
5. Все GPT и внешние вызовы логировать с первого реального интеграционного шага.
6. Все промежуточные результаты сохранять как artifacts или logs.

## Связанные документы верхнего уровня

- [SEO_BRIEF_IMPLEMENTATION_PLAN_RU.md](/Users/grigorijgromov/Desktop/Overnight/Projects/MarketingService/marketing-service/docs/SEO_BRIEF_IMPLEMENTATION_PLAN_RU.md)
- [ARCHITECTURE.md](/Users/grigorijgromov/Desktop/Overnight/Projects/MarketingService/marketing-service/docs/ARCHITECTURE.md)
