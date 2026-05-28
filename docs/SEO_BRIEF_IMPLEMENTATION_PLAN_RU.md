# SEO Brief Implementation Plan

Этот документ фиксирует рекомендуемый порядок разработки отдельного модуля AI SEO Brief внутри текущего `marketing-service`.

Связанный контекст:

- [ARCHITECTURE.md](/Users/grigorijgromov/Desktop/Overnight/Projects/MarketingService/marketing-service/docs/ARCHITECTURE.md)
- [MVP_REWORK_IMPLEMENTATION_PLAN_RU.md](/Users/grigorijgromov/Desktop/Overnight/Projects/MarketingService/marketing-service/docs/MVP_REWORK_IMPLEMENTATION_PLAN_RU.md)
- [seo_brief_service_business_logic.md](</Users/grigorijgromov/Downloads/seo_brief_service_business_logic.md>)

## Цель внедрения

Добавить в монорепо отдельный модуль, который:

1. принимает тему, рынок, язык, аудиторию, продуктовый контекст и `brand memory`;
2. собирает SEO-данные через DataForSEO;
3. использует AI для semantic decisions;
4. считает deterministic scoring в коде;
5. выбирает лучший keyword cluster;
6. генерирует structured SEO brief;
7. сохраняет evidence pack и audit trail.

Важно:

- модуль не должен писать финальную статью;
- модуль не должен быть частью `project-management`;
- модуль должен использовать `brand memory` как внешний контекст, а не зависеть от `Project` aggregate целиком.

## Рекомендуемое разбиение

Лучше разбить разработку не на `7`, а на `11` этапов.

Причина:

- вы хотите после каждого шага иметь маленький, но осязаемый результат;
- здесь много независимых кусков сложности: storage, transport, worker, LLM, DataForSEO, scoring, UI;
- observability для GPT и внешних вызовов нельзя оставлять на потом.

Граница MVP:

- к концу `Phase 7` появляется первый живой research MVP;
- к концу `Phase 9` появляется первый decision MVP с выбором cluster;
- к концу `Phase 10` появляется первый product-usable MVP с финальным brief;
- `Phase 11` это operational hardening и удобство ежедневной работы.

## Target placement в текущем репозитории

Новый код лучше разложить так:

```text
packages/
  seo-briefing/
    src/
      domain/
      ports/
      use-cases/
      services/
      seo-briefing.module.ts

packages/infrastructure/src/
  seo-briefing/
    dataforseo.adapter.ts
    seo-brief-ai.adapter.ts
    brand-memory.reader.ts
    seo-brief-run.drizzle-repository.ts
    seo-brief-log.drizzle-repository.ts

apps/api/src/
  seo-briefing/
    seo-brief.controller.ts
    schemas/

apps/worker/src/processors/
  seo-brief-run.worker.ts
```

Принцип:

- `packages/seo-briefing` хранит orchestration, state model, use cases и scoring rules;
- `packages/infrastructure` хранит внешние адаптеры и persistence;
- `apps/api` дает transport API;
- `apps/worker` исполняет длинные run-ы в фоне.

## Сквозное требование: observability и audit trail

Это не дополнительная задача, а обязательное свойство всей реализации.

На каждом этапе должны логироваться:

1. переходы run-а по стадиям;
2. все вызовы GPT/LLM;
3. все вызовы DataForSEO и других внешних систем;
4. все fallback attempts;
5. все вычисленные scoring values;
6. все причины выбора и отклонения cluster-ов.

Минимум, который должен быть виден по каждому GPT шагу:

- `run_id`
- `stage`
- `operation`
- `model`
- `prompt_version`
- `request_payload`
- `response_payload`
- `started_at`
- `finished_at`
- `latency_ms`
- `token_usage`
- `estimated_cost`
- `status`
- `error_message nullable`

Минимум, который должен быть виден по каждому внешнему вызову:

- `run_id`
- `stage`
- `provider`
- `endpoint`
- `request_payload`
- `response_payload`
- `started_at`
- `finished_at`
- `latency_ms`
- `estimated_cost`
- `cache_hit`
- `status`
- `error_message nullable`

Минимум, который должен быть виден по каждому вычислению:

- `run_id`
- `stage`
- `formula_name`
- `input_payload`
- `result_payload`
- `created_at`

## Phase 0. Зафиксировать boundaries и contracts

Цель: не смешать новый модуль с текущими bounded contexts.

### Что делаем

1. Создаем новый пакет `packages/seo-briefing`.
2. Вводим отдельные порты:
   - `BrandMemoryReaderPort`
   - `SeoBriefRunRepository`
   - `SeoBriefArtifactRepository`
   - `SeoBriefRunLogRepository`
   - `SeoBriefLlmLogRepository`
   - `SeoBriefExternalCallLogRepository`
   - `SeoBriefScoreLogRepository`
   - `SeoResearchPort`
   - `SeoBriefAiPort`
3. Договариваемся, что `brand memory` читается на старте run-а и сохраняется как snapshot.
4. Не используем напрямую текущий `AiGatewayPort` из `project-management`.
5. Не тянем внутрь нового модуля `Project` aggregate.

### Результат

Появляется четкая граница:

```text
project-management -> source of brand memory
seo-briefing -> autonomous SEO research and brief workflow
infrastructure -> DataForSEO / LLM / DB adapters
```

### Что можно потрогать после этапа

- пустой `seo-briefing` пакет в монорепо;
- зафиксированные интерфейсы портов;
- понятная карта зависимостей.

## Phase 1. Собрать каркас модуля и transport shell

Цель: получить видимый технический скелет до реальной бизнес-логики.

### Что делаем

1. Добавляем `seo-briefing.module.ts`.
2. Добавляем controller в `apps/api/src/seo-briefing`.
3. Добавляем DTO/schemas для создания run-а.
4. Добавляем `ping` или `health` endpoint модуля.
5. Добавляем заглушку worker processor.

### Результат

Модуль уже существует как отдельная вертикаль в коде.

### Что можно потрогать после этапа

- новый endpoint, который отвечает;
- новый модуль, подключенный в API;
- новый processor-файл в worker.

## Phase 2. Подготовить minimal data model и state model

Цель: сначала создать каркас хранения run-ов и состояний.

### Что делаем

1. Заводим таблицу `seo_brief_runs`.
2. Заводим таблицу `seo_brief_run_steps`.
3. Заводим таблицу `seo_brief_run_artifacts`.
4. Заводим таблицу `seo_briefs`.
5. Фиксируем run statuses и step statuses.
6. Сохраняем input snapshot:
   - topic seed
   - market
   - language
   - audience
   - product context
   - brand memory snapshot
   - key message
   - audience shift
   - CTA
   - SEO/Product weights

### Минимальный состав таблиц

`seo_brief_runs`

```text
id
project_id nullable
topic_seed
country
language
audience
product_name
product_description
brand_memory_snapshot jsonb
key_message
audience_before
audience_after
cta
seo_weight
product_weight
status
failure_reason nullable
created_at
updated_at
```

`seo_brief_run_steps`

```text
id
run_id
stage
status
started_at
finished_at nullable
error_message nullable
created_at
```

`seo_brief_run_artifacts`

```text
id
run_id
stage
artifact_type
payload jsonb
attempt
created_at
```

### Результат

Появляется база для очередей, retries, дебага и чтения состояния run-а.

### Что можно потрогать после этапа

- можно создать run в БД;
- можно увидеть status;
- можно увидеть step timeline даже без реальной бизнес-логики.

## Phase 3. Добавить observability foundation

Цель: до интеграций заложить реальный audit trail для GPT и внешних API.

### Что делаем

1. Заводим таблицу `seo_brief_llm_calls`.
2. Заводим таблицу `seo_brief_external_calls`.
3. Заводим таблицу `seo_brief_score_logs`.
4. Добавляем correlation ids:
   - `run_id`
   - `step_id`
   - `call_id`
5. Добавляем единый сервис записи LLM логов.
6. Добавляем единый сервис записи external call логов.
7. Добавляем единый сервис записи scoring snapshots.
8. Добавляем structured logs в Pino для:
   - start/end stage
   - llm call start/end
   - external call start/end
   - scoring computed
   - fallback started/completed

### Минимальный состав таблиц

`seo_brief_llm_calls`

```text
id
run_id
step_id nullable
operation
model
prompt_version
request_payload jsonb
response_payload jsonb nullable
token_usage_input nullable
token_usage_output nullable
estimated_cost nullable
started_at
finished_at nullable
status
error_message nullable
```

`seo_brief_external_calls`

```text
id
run_id
step_id nullable
provider
endpoint
request_payload jsonb
response_payload jsonb nullable
estimated_cost nullable
cache_hit boolean
started_at
finished_at nullable
status
error_message nullable
```

`seo_brief_score_logs`

```text
id
run_id
step_id nullable
formula_name
input_payload jsonb
result_payload jsonb
created_at
```

### Результат

У модуля появляется полноценная трассировка действий GPT и внешних вызовов.

### Что можно потрогать после этапа

- тестовый LLM call log в БД;
- тестовый external call log в БД;
- тестовый score log;
- timeline run-а в приложении и в логах.

## Phase 4. Собрать input layer и snapshot brand memory

Цель: добиться корректного и воспроизводимого старта run-а.

### Что делаем

1. Реализуем `BrandMemoryReaderPort` через текущий `ProjectRepository`.
2. Добавляем `CreateSeoBriefRun` command.
3. Добавляем нормализацию входа:
   - market
   - language
   - balance weights
   - product context
4. На старте run-а снимаем `brand_memory_snapshot`.
5. Сохраняем normalized input как artifact.

### Результат

Каждый run становится воспроизводимым и независимым от будущих изменений проекта.

### Что можно потрогать после этапа

- создать run по `projectId`;
- увидеть сохраненный `brand_memory_snapshot`;
- увидеть normalized input в artifacts.

## Phase 5. Собрать DataForSEO foundation

Цель: стабилизировать SEO data layer до полного orchestration.

### Что делаем

1. Реализуем `SeoResearchPort` поверх DataForSEO.
2. Добавляем методы:
   - search volume
   - keyword suggestions
   - organic SERP
   - backlinks/domain metrics
   - onpage parsing
3. Добавляем cache layer для запросов к DataForSEO.
4. Добавляем cost logging на каждый внешний вызов.
5. Нормализуем ошибки, retries и timeouts.
6. Возвращаем DTO уровня домена, а не сырые vendor shapes.

### Результат

SEO data adapter становится предсказуемым и готовым к включению в workflow.

### Что можно потрогать после этапа

- отдельно дернуть search volume;
- отдельно дернуть keyword suggestions;
- отдельно дернуть SERP;
- увидеть raw response и cost log в БД.

## Phase 6. Собрать LLM foundation

Цель: сделать AI-операции управляемыми и наблюдаемыми до сборки полного pipeline.

### Что делаем

1. Реализуем `SeoBriefAiPort`.
2. Добавляем structured methods:
   - keyword expansion
   - keyword triage
   - clustering
   - product bridge generation
   - cluster selection rationale
   - brief generation
3. Добавляем prompt versioning.
4. Добавляем request/response logging в `seo_brief_llm_calls`.
5. Добавляем защиту от невалидного JSON/structured output.
6. Добавляем нормализованные AI errors.

### Результат

LLM перестает быть “черным ящиком” и становится управляемым адаптером.

### Что можно потрогать после этапа

- отдельно вызвать keyword expansion;
- отдельно увидеть prompt version и response payload;
- отдельно увидеть token usage, latency и статус ошибки.

## Phase 7. Реализовать research pipeline v1

Цель: получить первый end-to-end run без cluster selection.

### Что делаем

1. Добавляем асинхронный executor `ProcessSeoBriefRun`.
2. Реализуем стадии:
   - `created`
   - `keyword_expansion`
   - `keyword_research`
   - `related_keyword_research`
3. На каждой стадии сохраняем artifacts.
4. На каждой стадии сохраняем LLM/external call logs.
5. Добавляем API:
   - создать run
   - посмотреть run status
   - получить raw evidence

### Что пока можно упростить

1. Без clustering.
2. Без scoring.
3. Без final selection.
4. Без brief generation.
5. Без сложной UI preview.

### Результат

Система уже умеет:

- принять marketer input;
- собрать keyword hypotheses;
- проверить спрос;
- добрать related keywords;
- сохранить доказательную базу по run-у.

### Что можно потрогать после этапа

- запустить реальный run от начала до конца;
- увидеть keyword hypotheses;
- увидеть enriched keywords после Search Volume и Suggestions;
- увидеть полный step-by-step trace run-а.

## Phase 8. Добавить SERP, domain metrics и onpage research

Цель: обогатить pipeline фактами для выбора cluster-а.

### Что делаем

1. Добавляем `serp_research`.
2. Добавляем `domain_metrics_research`.
3. Добавляем `onpage_research`.
4. Привязываем результаты к нужным seed/research keywords.
5. Сохраняем все как artifacts и external call logs.

### Результат

Run уже собирает не только спрос, но и конкурентный landscape.

### Что можно потрогать после этапа

- увидеть top results по ключевым запросам;
- увидеть domain strength inputs;
- увидеть parsed competitor page structure и content gaps.

## Phase 9. Реализовать clustering, scoring и selection logic

Цель: превратить research data в решение, а не просто в набор сырого SEO-контекста.

### Что делаем

1. Реализуем AI keyword triage.
2. Реализуем AI clustering.
3. Реализуем representative keyword selection.
4. Реализуем deterministic scoring services в коде:
   - `DemandScoreService`
   - `CompetitionScoreService`
   - `SeoScoreService`
   - `ProductScoreService`
   - `FinalClusterScoreService`
5. Логируем все вычисления в `seo_brief_score_logs`.
6. Реализуем decision labels:
   - `MAIN_ARTICLE`
   - `SUPPORTING_ARTICLE`
   - `FUTURE_TOPIC`
   - `CHANGE_ANGLE`
   - `REJECT`
7. Реализуем базовый fallback:
   - mixed intent
   - weak data
   - high competition
   - weak product fit

### Принцип

AI возвращает semantic inputs и explanations, но:

- формулы;
- penalties;
- перераспределение весов;
- final numeric scoring

считает backend-код.

### Результат

Run уже умеет выбирать лучший cluster на основе баланса SEO/Product, а не по одному keyword и не по “мнению модели”.

### Что можно потрогать после этапа

- увидеть clusters по run-у;
- увидеть numeric scores и penalties;
- увидеть, почему выбран именно этот cluster;
- увидеть rejected/postponed clusters.

## Phase 10. Генерация SEO brief и evidence pack

Цель: довести pipeline до полезного продукта для маркетолога.

### Что делаем

1. Реализуем final cluster selection stage.
2. Реализуем AI generation structured brief.
3. Сохраняем финальные сущности:
   - selected cluster
   - selected angle
   - SEO title
   - meta description
   - H1/H2/H3 outline
   - FAQ
   - product placement
   - rejected/postponed clusters
4. Собираем human-readable preview.
5. Формируем полноценный evidence pack.

### Definition of Done для первого product MVP

MVP можно считать завершенным, если run возвращает:

1. selected cluster;
2. primary and secondary keywords;
3. SEO score;
4. Product score;
5. competition score;
6. selected angle;
7. structured brief;
8. rejected/postponed clusters with reasons;
9. evidence pack;
10. timeline действий GPT и внешних вызовов.

### Результат

К концу этого этапа модуль уже решает основную бизнес-задачу и прозрачно объясняет, как он к решению пришел.

### Что можно потрогать после этапа

- получить финальный brief JSON;
- открыть human-readable preview;
- посмотреть полный evidence pack;
- посмотреть LLM/external/scoring trail для этого brief-а.

## Phase 11. UI, review flow, reruns и hardening

Цель: сделать модуль удобным и безопасным для постоянного операционного использования.

### Что делаем

1. Добавляем test UI / admin UI для запуска run-а.
2. Добавляем preview страницы brief-а.
3. Добавляем просмотр stages и artifacts по run-у.
4. Добавляем просмотр LLM logs и external call logs по run-у.
5. Добавляем rerun:
   - whole run
   - stage rerun
   - regenerate brief
6. Добавляем manual review статусы:
   - `needs_manual_review`
   - `rejected`
7. Добавляем ручное изменение balance slider и повторный пересчет выбора.
8. Дорабатываем cache policy по DataForSEO.
9. Добавляем deduplication похожих run-ов.
10. Добавляем per-stage metrics и duration tracking.
11. Добавляем cost dashboard:
   - DataForSEO cost
   - LLM token cost
   - total run cost
12. Добавляем ограничения:
   - max initial keywords
   - max suggestion seeds
   - max clusters to score
   - max deep analysis clusters
   - max fallback attempts
13. Улучшаем retry/idempotency.
14. Добавляем regression tests на scoring formulas и selection logic.

### Результат

Модуль становится устойчивым, предсказуемым по стоимости и безопасным для постоянного использования.

### Что можно потрогать после этапа

- UI со step timeline;
- экран со всеми GPT вызовами по run-у;
- rerun конкретного шага;
- cost dashboard;
- ручной review и повторная генерация brief-а.

## Почему именно так

Такое разбиение выбрано потому, что здесь есть четыре разных типа сложности:

1. архитектурная сложность;
2. интеграционная сложность;
3. алгоритмическая сложность;
4. наблюдаемость и управляемость.

Если делать все сразу, вы смешаете:

- storage model;
- orchestration;
- vendor integrations;
- AI prompting;
- scoring formulas;
- observability;
- preview/UI.

Это почти гарантированно приведет к ломкому коду и плохой дебажности.

## Практический порядок запуска

Если нужен самый прагматичный маршрут, я бы шел так:

1. `Phase 0`
2. `Phase 1`
3. `Phase 2`
4. `Phase 3`
5. `Phase 4`
6. `Phase 5`
7. `Phase 6`
8. `Phase 7`
9. `Phase 8`
10. `Phase 9`
11. `Phase 10`

После этого уже можно давать маркетологу реальный workflow. `Phase 11` делать после первых живых кейсов и накопления обратной связи.

## Итог

Рекомендация:

- разбить разработку на `11` этапов;
- считать `Phase 10` концом первого product-usable MVP;
- делать модуль как отдельный bounded context `seo-briefing`;
- тащить из текущей системы только `brand memory snapshot`, а не остальную бизнес-логику проекта;
- логирование GPT и внешних вызовов считать обязательной частью архитектуры уже с ранних этапов, а не постфактум.
