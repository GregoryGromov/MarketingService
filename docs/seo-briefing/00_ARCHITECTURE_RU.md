# SEO Briefing Architecture Contract

Этот документ фиксирует архитектурные решения для модуля `seo-briefing`.

Главная мысль: да, архитектуру в стиле DDD + hexagonal здесь стоит продумать отдельно до основной реализации, но не как теоретическую диаграмму, а как рабочий контракт для кода.

## Зачем отдельный архитектурный контракт

Без него модуль очень быстро превратится в смесь:

- prompt-ов;
- raw API вызовов;
- бизнес-формул;
- логирования;
- SQL и JSONB;
- transport-кода;
- воркеров.

Для этого модуля это особенно опасно, потому что в нем одновременно есть:

- orchestration;
- внешние SEO data providers;
- LLM;
- scoring formulas;
- audit trail.

## Bounded Context

Новый bounded context:

```text
seo-briefing
```

Его ответственность:

- принять intent маркетолога;
- снять snapshot контекста;
- провести SEO research;
- провести semantic processing;
- посчитать deterministic scoring;
- выбрать cluster;
- сгенерировать final brief;
- сохранить evidence pack и audit trail.

Что не входит в этот bounded context:

- управление `Project` как aggregate;
- editorial production;
- article generation;
- publishing;
- general-purpose AI gateway для всего сервиса.

## Граница с текущей системой

Связь с текущим кодом должна быть минимальной.

Разрешенные точки интеграции:

1. чтение `brand memory` через порт;
2. общие инфраструктурные зависимости:
   - Postgres
   - Redis
   - BullMQ
   - Pino
3. общие базовые утилиты и shared primitives.

Нежелательные зависимости:

1. прямой импорт `Project` aggregate в use case-ы `seo-briefing`;
2. переиспользование `AiGatewayPort` из `project-management`;
3. смешивание SEO run state с campaign/editorial state.

## DDD-модель

На MVP не нужно делать сверхсложную доменную модель.

Достаточно следующего:

### Aggregate Root

`SeoBriefRun`

Это главный aggregate модуля.

Он отвечает за:

- lifecycle run-а;
- transition между стадиями;
- хранение входного snapshot;
- фиксацию финального outcome;
- переходы в `failed`, `done`, `needs_manual_review`, `rejected`.

### Supporting records

Следующие сущности на MVP лучше держать не как отдельные aggregate roots, а как supporting persistence records:

- `SeoBriefRunStep`
- `SeoBriefArtifact`
- `SeoBriefLlmCallLog`
- `SeoBriefExternalCallLog`
- `SeoBriefScoreLog`
- `SeoBriefDocument`

Причина:

- они важны для audit trail;
- у них пока нет собственной глубокой доменной жизни;
- усложнять модель отдельными aggregate-ами здесь рано.

### Value Objects

На старте стоит выделить value objects или typed payloads для:

- `SeoBriefInput`
- `MarketContext`
- `ProductContext`
- `AudienceShift`
- `SeoProductBalance`
- `KeywordCluster`
- `ClusterScore`
- `SeoBriefPayload`

## Hexagonal Architecture

Модуль должен быть построен по принципу:

```text
core application/domain
  <- ports
  <- adapters
```

### Внутренний слой

`packages/seo-briefing/src/`

Содержит:

- domain
- ports
- use-cases
- pure services

Там не должно быть:

- SQL;
- HTTP request details;
- vendor DTO DataForSEO;
- raw OpenAI SDK code;
- Pino setup;
- BullMQ implementation details.

### Внешний слой

`packages/infrastructure/src/seo-briefing/`

Содержит:

- Drizzle repositories;
- DataForSEO adapter;
- OpenAI/LLM adapter;
- brand memory reader adapter;
- log repositories;
- queue integration details.

### Transport layer

`apps/api` и `apps/worker`

Содержит:

- controller;
- request validation;
- response mapping;
- worker processor;
- job to command handoff.

## Порты

Минимальный набор портов:

### Read/context ports

- `BrandMemoryReaderPort`

### Persistence ports

- `SeoBriefRunRepository`
- `SeoBriefArtifactRepository`
- `SeoBriefRunStepRepository`
- `SeoBriefLlmLogRepository`
- `SeoBriefExternalCallLogRepository`
- `SeoBriefScoreLogRepository`
- `SeoBriefDocumentRepository`

### External service ports

- `SeoResearchPort`
- `SeoBriefAiPort`

### Optional orchestration ports

- `SeoBriefJobPort`
- `ClockPort`
- `IdGeneratorPort`

## Use Cases

Базовые use cases:

- `CreateSeoBriefRun`
- `ProcessSeoBriefRun`
- `GetSeoBriefRun`
- `GetSeoBriefRunEvidence`
- `GetSeoBriefDocument`

Позже:

- `RetrySeoBriefRunStep`
- `RegenerateSeoBrief`
- `ReviewSeoBriefRun`
- `RejectSeoBriefRun`

## Stateless services

Что должно быть pure service-ами, а не LLM-магией:

- `DemandScoreService`
- `CompetitionScoreService`
- `SeoScoreService`
- `ProductScoreService`
- `FinalClusterScoreService`
- `RunStagePolicyService`
- `FallbackPolicyService`

## Что AI делает, а что нет

AI делает:

- keyword expansion;
- keyword triage;
- clustering;
- product bridge suggestion;
- cluster selection explanation;
- brief generation.

Код делает:

- state transitions;
- retries;
- idempotency;
- cache rules;
- scoring formulas;
- penalties;
- audit/logging;
- persistence;
- run status management.

## Persistence strategy

На MVP нормально начать с гибридного подхода:

- `runs`, `steps`, `logs` как нормальные таблицы;
- часть промежуточных исследований как JSONB artifacts;
- final brief как отдельная запись или document table.

Это дает:

- управляемый lifecycle;
- удобный audit trail;
- меньше ранней схемной сложности.

## Logging strategy

Нужно логировать на двух уровнях:

1. application logs через Pino;
2. domain-visible audit records через DB tables.

То есть не выбирать между ними, а делать оба слоя.

## Очереди

Длинный run лучше исполнять в worker, а не в HTTP request lifecycle.

Подход:

- API создает run;
- API enqueue job;
- worker исполняет `ProcessSeoBriefRun`;
- каждое stage completion обновляет run/steps/logs.

## Folder structure

Целевая структура:

```text
packages/seo-briefing/src/
  domain/
    seo-brief-run.aggregate.ts
    seo-brief-run.types.ts
  ports/
    brand-memory-reader.port.ts
    seo-brief-run.repository.ts
    seo-brief-artifact.repository.ts
    seo-brief-llm-log.repository.ts
    seo-brief-external-call-log.repository.ts
    seo-brief-score-log.repository.ts
    seo-research.port.ts
    seo-brief-ai.port.ts
  services/
    demand-score.service.ts
    competition-score.service.ts
    seo-score.service.ts
    product-score.service.ts
    final-cluster-score.service.ts
  use-cases/
    create-seo-brief-run/
    process-seo-brief-run/
    get-seo-brief-run/
    get-seo-brief-evidence/
  seo-briefing.module.ts
```

## Exit criteria для архитектурной фазы

Архитектурный этап можно считать закрытым, если:

1. зафиксирован bounded context;
2. определен aggregate root;
3. зафиксированы ports/adapters;
4. зафиксирована граница с `project-management`;
5. решено, что scoring вычисляется кодом;
6. решено, что observability это first-class часть модуля.
