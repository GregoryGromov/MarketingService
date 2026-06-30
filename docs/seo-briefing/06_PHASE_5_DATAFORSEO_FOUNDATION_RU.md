# Phase 5. DataForSEO Foundation

## Цель

Собрать устойчивый SEO data layer до запуска полного research pipeline.

## Почему не надо сразу писать весь pipeline

Потому что DataForSEO integration сама по себе содержит достаточно рисков:

- разный shape у endpoint responses;
- cost sensitivity;
- ошибки сетевого слоя;
- retry logic;
- кеширование;
- нормализация market/language/location.

## Scope

Входит:

- `SeoResearchPort`;
- DataForSEO adapter;
- DTO нормализация;
- caching;
- cost logging;
- retries и timeouts.

Не входит:

- GPT;
- clustering;
- selection logic.

## Методы порта

Минимум:

- `getSearchVolume`
- `getKeywordSuggestions`
- `getOrganicSerp`
- `getDomainMetrics`
- `getOnPageParse`

## Что сделать

1. Добавить `SeoResearchPort` в `packages/seo-briefing`.
2. Описать domain-level DTO для каждого метода.
3. Реализовать `DataForSeoAdapter` в `packages/infrastructure`.
4. Добавить нормализацию ошибок.
5. Добавить retry policy.
6. Добавить timeout policy.
7. Добавить cache layer.
8. Интегрировать external call logger.

## Deliverables

1. Порт.
2. Adapter.
3. Набор DTO.
4. Cache rules.
5. External call logs для каждого endpoint.

## Что можно потрогать после фазы

1. Вызвать search volume по тестовым keywords.
2. Вызвать keyword suggestions.
3. Вызвать organic SERP.
4. Увидеть нормализованный response.
5. Увидеть cache hit/miss и estimated cost.

## Что нельзя делать в этой фазе

1. Не тащить raw vendor payload дальше application boundary.
2. Не делать бизнес-решения прямо в adapter-е.
3. Не объединять несколько endpoint-ов в один “магический” метод.

## Exit Criteria

Фаза завершена, если:

1. все базовые методы порта работают отдельно;
2. ответы нормализуются в domain DTO;
3. ошибки и retries предсказуемы;
4. вызовы логируются и кэшируются.
