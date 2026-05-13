# MVP Rework Notes

Источник: `/Users/grigorijgromov/Downloads/MVP_REWORK_PLAN_RU.md`

Дата фиксации в проекте: `2026-05-13`

## Суть рефакторинга

Нужно перевести текущий сервис из article-centric flow в campaign-based production workflow, не переписывая production engine с нуля.

Было:

```text
Project -> Article -> ChannelAdaptation -> Translation -> Publication
```

Должно стать:

```text
Project -> Campaign -> EN canonical longread -> base adaptations -> translations -> publications
```

Ключевой принцип: `Article`, `ChannelAdaptation`, `Translation`, `Publication` остаются нижним production engine. Сверху добавляется новый orchestration layer `Campaign`.

## Что считается source of truth

- `Brand Memory` хранит truth and constraints, а не tone of voice.
- `Preset` хранит точный production plan.
- `Campaign` хранит конкретный production run.
- `EN longread` всегда user-provided и является canonical source.
- `Style` хранится на уровне конкретной planned publication, а не бренда.

Формула:

```text
Brand Memory = что можно и нельзя говорить
Channel = технический формат
Style = как звучит конкретная публикация
```

## Новый пользовательский flow

```text
Brand Memory
  -> New Campaign
  -> Select Preset
  -> Upload/Paste EN Longread + Start Date
  -> Start Production
  -> Source Guideline Check
  -> Base Adaptations in EN
  -> Stage 1 Quality Loop
  -> Translations
  -> Stage 2 Fidelity Loop
  -> Inbox only for exceptions
  -> Campaign Pack
  -> Final Campaign Approval
  -> Publish / Export
  -> Basic metrics/status
```

## Что добавляется в доменную модель

Минимальные новые сущности:

- `Campaign`
- `CampaignPreset`
- `PlannedPublication`
- `CampaignArtifact`
- `QualityCheckResult`
- `ApprovalItem`
- `WorkflowRun` или `ProductionRun`

Ключевая bridge-сущность:

```text
CampaignArtifact
  Campaign -> Article
  Campaign -> ChannelAdaptation
  Campaign -> Translation
  Campaign -> Publication
```

Это позволяет не делать full Artifact Graph rewrite на MVP.

## Production semantics

### Source

- CMO вставляет готовый EN longread.
- После source check он становится `locked`.
- Система не должна молча переписывать исходник без решения человека.

### Adaptations

- Base adaptation создается `per planned publication`.
- Base adaptation всегда сначала создается в `EN`.
- Для EN-публикаций translation не нужен.

### Stage 1

Проверяет:

- channel format compliance
- style match
- readability and clarity
- brand safety
- forbidden claims
- legal risk
- approved facts consistency
- duplicate/spam risk
- length/format constraints

Логика:

```text
generate adaptation
  -> check
  -> revise if failed
  -> retry up to 5 attempts
  -> inbox only if still failed
```

### Stage 2

Проверяет:

- no meaning drift
- no added unsupported claims
- no lost key claims
- glossary compliance
- banned phrases / forbidden claims in target locale
- future locale-specific criteria

Логика:

```text
generate translation
  -> check
  -> revise if failed
  -> retry up to 5 attempts
  -> inbox only if still failed
```

## Approval model

`Inbox` должен содержать только exception-driven human decisions:

- source issue
- adaptation quality exception
- translation fidelity exception
- publishing exception
- final campaign approval

Обычные успешно прошедшие adaptation/translation не должны требовать ручного approve.

Главное правило публикации:

```text
No auto-publish before final campaign approval
```

## Publishing model

- Используем текущий publishing layer.
- Каналы должны быть преднастроены на уровне workspace/admin.
- Если connector недоступен, нужен fallback в manual export.
- После final approval ready artifacts превращаются в scheduled publications или exports.

## Non-goals MVP

В этот этап не входят:

- AI-generated canonical longread from scratch
- self-learning
- hypothesis testing
- A/B testing
- prompt self-improvement
- custom preset builder for CMO
- full Artifact Graph rewrite
- complex RBAC
- connector setup inside the CMO flow
- full analytics dashboard

## Как это ложится на текущее монорепо

Предварительное маппирование по текущим bounded contexts:

- `packages/project-management`
  сюда логично положить `Campaign`, `CampaignPreset`, `BrandMemory`, `ApprovalItem`, `WorkflowRun`
- `packages/editorial`
  остается production engine для `Article`, `ChannelAdaptation`, `Translation`
- `packages/publishing`
  остается execution layer для `Publication`; существующий `PublicationPlan` потенциально можно переиспользовать как часть planned publication / scheduling model
- `packages/infrastructure`
  сюда уйдут новые drizzle repositories, AI gateway adapter, quality check adapters и channel/export adapters

## Что уже выглядит хорошо переиспользуемым

- Текущая цепочка `Article -> ChannelAdaptation -> Translation` совпадает с новым production order.
- `Publication` уже отделен от editorial-объектов, что подходит под final campaign approval.
- В `publishing` уже есть `PublicationPlan`, значит планирование публикаций не нужно изобретать с нуля.

## Что мне уже ясно

- Продуктовая логика понятна.
- Граница между orchestration layer и existing engine понятна.
- Порядок pipeline понятен: `source check -> adaptation stage -> translation stage -> publishing`.
- Approval model понятен: inbox only for exceptions plus final campaign approval.
- MVP-границы тоже понятны: learning и сложная автономия пока не делаются.

## Что нужно будет зафиксировать перед большим внедрением

Это не блокирует понимание идеи, но это важные implementation decisions:

1. `Brand Memory` держим как отдельную сущность проекта или как часть `Project`.
2. `CampaignPreset` храним в БД как системные записи или стартуем со статического seed/config.
3. `PlannedPublication` делаем отдельной таблицей или храним как snapshot внутри `Campaign` с дальнейшей материализацией в `PublicationPlan`.
4. `CampaignArtifact` делаем отдельной таблицей-связкой или добавляем `campaign_id` в текущие таблицы и оставляем roles отдельно.
5. `Approval Inbox` реализуем как новую универсальную таблицу `approval_items`, а не как набор статусов на разных агрегатах.
6. `AI Gateway` на первом этапе будет thin wrapper над текущим adapter-слоем, а не отдельной большой подсистемой.
7. Нужна явная политика versioning для source fixes, adaptation revisions и translation revisions.

## Принятые решения на сейчас

1. `Brand Memory` делаем частью `Project`.
2. `PlannedPublication` делаем отдельной таблицей.

## Мои рекомендации по остальным решениям

### CampaignPreset

Рекомендация: хранить в БД как системные preset-ы.

Почему так лучше:

- preset-ы являются продуктовой конфигурацией, а не кодом
- их можно будет редактировать без релиза приложения
- будет проще добавить admin-only редактирование позже
- это лучше ложится на `preset_id` в `Campaign`

Практичный MVP-вариант:

- таблица `campaign_presets`
- таблица `campaign_preset_publications`
- initial seed на 3-5 системных preset-ов
- в UI показывать только `active system presets`

То есть это не выбор между "БД" и "seed". Правильнее: `source of truth = БД`, начальное наполнение = `seed`.

### CampaignArtifact

Рекомендация: делать отдельную таблицу-связку.

Почему так лучше:

- не придется протаскивать `campaign_id` через `articles`, `channel_adaptations`, `translations`, `publications`
- текущие сущности останутся переиспользуемыми вне campaign flow
- удобнее хранить `role`, а это важно для `canonical_longread_en`, `telegram_es_publishable` и похожих связей
- меньше риск размыть границы bounded contexts

Практичный MVP-вариант:

```text
campaign_artifacts
  id
  campaign_id
  artifact_type
  artifact_id
  planned_publication_id nullable
  role
  created_at
```

### Approval Inbox

Рекомендация: делать отдельную универсальную таблицу `approval_items`.

Почему так лучше:

- inbox — это отдельная очередь human decisions, а не просто статус на сущностях
- один campaign может иметь несколько независимых исключений
- можно хранить reason, suggested fix, attempts, resolution history
- это нормально расширяется на source issues, quality exceptions и publishing exceptions

Практичный MVP-вариант:

```text
approval_items
  id
  project_id
  campaign_id
  planned_publication_id nullable
  artifact_type nullable
  artifact_id nullable
  type
  status
  severity
  title
  details jsonb
  suggested_fix jsonb
  created_at
  resolved_at nullable
```

### AI Gateway

Под "в плане" здесь имеется в виду глубина реализации на MVP.

Рекомендация: на первом этапе делать thin wrapper, не большую платформу.

Что обязательно должно быть сразу:

- единая точка входа для всех новых AI operations
- structured output + schema validation
- retry policy
- prompt or operation version
- логирование вызовов и ошибок

Что можно отложить:

- сложный router по моделям
- cost dashboards
- auto-optimization
- advanced experiment framework

Иначе есть риск закопаться в инфраструктуру вместо migration to campaign workflow.

### Versioning policy

Под "в плане" здесь имеется в виду как именно моделировать версии артефактов и попыток quality loops.

Рекомендация:

- `Article`: добавить source revision history, если source fix принят или сделан вручную
- `ChannelAdaptation`: использовать уже существующую модель `channel_adaptation_versions`
- `Translation`: добавить отдельную таблицу версий по аналогии с adaptation, потому что сейчас у translation версий нет
- `QualityCheckResult`: хранить отдельно от версий контента, как результаты проверок и попыток

Практичная схема:

```text
source_content_versions
  article_id
  kind: original | suggested_fix | manual_edit | accepted_source

channel_adaptation_versions
  уже существует

translation_versions
  translation_id
  kind: generated | ai_revision | manual_edit
  source_version_id nullable
  content
  meta

quality_check_results
  artifact_type
  artifact_id
  artifact_version_id nullable
  check_type
  result
  attempt_number
  reasons
  suggested_fix
  raw_ai_result
```

Главный принцип:

- версия контента отвечает на вопрос `что именно было создано`
- quality result отвечает на вопрос `как это было проверено и почему прошло/не прошло`

## Рабочая позиция

Текущее понимание достаточное, чтобы переходить к техническому планированию и разбивке на этапы внедрения. Неясностей в продуктовой идее нет; остались только нормальные инженерные решения по модели данных и границам модулей.
