# Phase 0. Boundaries And Contracts

## Цель

Зафиксировать границы модуля до того, как появится первая строка production-кода.

## Почему эта фаза идет первой

Потому что без нее AI агент начнет:

- импортировать существующие агрегаты не по границе;
- тянуть `AiGatewayPort` из другого контекста;
- смешивать transport и domain;
- писать prompt-first код без нормальной модели.

## Scope

Входит:

- boundaries;
- ports;
- зависимость на `brand memory`;
- правило по observability.

Не входит:

- миграции;
- API;
- worker execution;
- DataForSEO;
- LLM implementation.

## Что нужно сделать

1. Подтвердить, что новый bounded context называется `seo-briefing`.
2. Подтвердить, что `SeoBriefRun` это основной aggregate root.
3. Подтвердить набор портов.
4. Подтвердить, что `brand memory` приходит через `BrandMemoryReaderPort`.
5. Подтвердить, что `AiGatewayPort` из текущего `project-management` не используется.
6. Подтвердить, что score-ы считаются кодом, а не LLM.
7. Подтвердить, что GPT/external calls логируются как first-class data.

## Какие файлы трогать

На этом этапе можно ограничиться документацией:

- [00_ARCHITECTURE_RU.md](/Users/grigorijgromov/Desktop/Overnight/Projects/MarketingService/marketing-service/docs/seo-briefing/00_ARCHITECTURE_RU.md)
- [SEO_BRIEF_IMPLEMENTATION_PLAN_RU.md](/Users/grigorijgromov/Desktop/Overnight/Projects/MarketingService/marketing-service/docs/SEO_BRIEF_IMPLEMENTATION_PLAN_RU.md)

Если очень нужно, можно уже создать пустой каталог:

- `packages/seo-briefing/src/`

## Deliverables

1. Зафиксированный архитектурный документ.
2. Зафиксированный список phase docs.
3. Подтвержденный список портов.
4. Подтвержденный принцип observability-first.

## Что нельзя делать в этой фазе

1. Не писать DataForSEO adapter.
2. Не писать OpenAI adapter.
3. Не писать scoring formulas в коде.
4. Не создавать случайные таблицы без целевой модели.

## Что должен проверить AI агент

Перед переходом дальше агент должен уметь ответить:

1. Где заканчивается `project-management` и начинается `seo-briefing`?
2. Какой aggregate root в новом модуле?
3. Что именно AI делает, а что делает deterministic code?
4. Какие таблицы нужны для audit trail?

## Exit Criteria

Фаза завершена, если:

1. архитектурная граница описана явно;
2. список портов не вызывает двусмысленности;
3. логирование GPT и внешних вызовов признано обязательным;
4. есть явное понимание, что сначала строится модуль, а не prompt-скрипт.
