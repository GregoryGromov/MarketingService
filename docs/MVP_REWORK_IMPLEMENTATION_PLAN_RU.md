# MVP Rework Implementation Plan

Этот документ фиксирует точный порядок внедрения campaign-based MVP поверх текущего сервиса.

Связанный контекст:

- [MVP_REWORK_NOTES_RU.md](/Users/grigorijgromov/Desktop/Overnight/Projects/MarketingService/marketing-service/docs/MVP_REWORK_NOTES_RU.md)
- [ARCHITECTURE.md](/Users/grigorijgromov/Desktop/Overnight/Projects/MarketingService/marketing-service/docs/ARCHITECTURE.md)

## Цель внедрения

Перевести сервис с article-centric flow на campaign-based orchestration, не ломая текущий production engine:

```text
Project -> Campaign -> EN longread -> Adaptations -> Translations -> Publications
```

Существующие `Article`, `ChannelAdaptation`, `Translation`, `Publication` остаются ядром исполнения. Новый код должен в основном добавлять orchestration, quality, approval и campaign planning.

## Ключевые решения

- `Brand Memory` живет как часть `Project`
- `CampaignPreset` хранится в БД и наполняется seed-ом
- `PlannedPublication` делается отдельной таблицей
- `CampaignArtifact` делается отдельной таблицей-связкой
- `Approval Inbox` делается отдельной таблицей `approval_items`
- `AI Gateway` на MVP делается тонким общим слоем
- `Translation` получает полноценное versioning
- `QualityCheckResult` хранится отдельно от контентных версий

## Порядок внедрения

Ниже порядок выбран так, чтобы:

- сначала заложить data model
- потом собрать orchestration layer
- потом подключить AI and quality loops
- и только потом перестраивать UI/API flow

## Phase 0. Зафиксировать boundaries

Цель: не начать рефакторинг хаотично.

### Что делаем

1. Считаем `packages/editorial` production engine-ом.
2. Считаем `packages/publishing` publishing engine-ом.
3. Все новые campaign-driven сущности кладем в `packages/project-management`.
4. Все новые DB adapters и AI adapters кладем в `packages/infrastructure`.
5. Все transport endpoints и экраны перестраиваем только после того, как готовы domain model и use cases.

### Result

Появляется четкая граница:

```text
project-management = campaign orchestration
editorial = content production
publishing = scheduling and delivery
infrastructure = persistence + AI + external channels
```

## Phase 1. Подготовить data model

Цель: сначала создать таблицы и схемы, на которых будет держаться весь MVP.

### 1.1. Расширить `projects`

Добавить в `projects` поля Brand Memory:

- `brandName`
- `productDescription`
- `targetAudience`
- `approvedFacts` jsonb
- `forbiddenClaims` jsonb
- `glossary` jsonb
- `bannedPhrases` jsonb
- `requiredPhrases` jsonb
- `brandDocs` jsonb nullable

Принцип:

- это часть `Project`
- не надо пока выносить в отдельный aggregate

### 1.2. Добавить `campaign_presets`

Новая таблица:

```text
campaign_presets
  id
  name
  description
  source_language
  source_type
  is_active
  is_system
  created_at
  updated_at
```

### 1.3. Добавить `campaign_preset_publications`

Новая таблица:

```text
campaign_preset_publications
  id
  preset_id
  day_offset
  local_time
  channel
  language
  publication_type
  style
  position
  created_at
```

Зачем отдельно:

- preset должен хранить конкретный production plan
- массив в json здесь хуже, потому что публикации надо будет удобно читать, сортировать и копировать в snapshot

### 1.4. Добавить `campaigns`

Новая таблица:

```text
campaigns
  id
  project_id
  preset_id
  name
  source_article_id nullable
  start_date
  source_language
  status
  extra_instructions text nullable
  final_approved_at nullable
  created_at
  updated_at
```

Статусы на MVP:

- `draft`
- `source_checking`
- `source_needs_review`
- `producing`
- `needs_attention`
- `ready_for_final_approval`
- `approved_for_publishing`
- `publishing`
- `completed`
- `failed`
- `cancelled`

### 1.5. Добавить `planned_publications`

Новая таблица:

```text
planned_publications
  id
  campaign_id
  preset_publication_id nullable
  day_offset
  local_time
  scheduled_for
  channel
  language
  publication_type
  style
  publish_mode
  status
  notes nullable
  created_at
  updated_at
```

Статусы на MVP:

- `pending`
- `source_blocked`
- `adapting`
- `stage_1_failed`
- `translating`
- `stage_2_failed`
- `ready`
- `blocked`
- `publication_scheduled`
- `published`
- `exported`
- `failed`

Важно:

- `scheduled_for` материализуется из `start_date + day_offset + local_time`
- это уже campaign snapshot, а не ссылочная логика на preset

### 1.6. Добавить `campaign_artifacts`

Новая bridge-таблица:

```text
campaign_artifacts
  id
  campaign_id
  planned_publication_id nullable
  artifact_type
  artifact_id
  role
  created_at
```

`artifact_type`:

- `article`
- `adaptation`
- `translation`
- `publication`

`role` examples:

- `canonical_longread_en`
- `base_adaptation_en`
- `publishable_translation`
- `scheduled_publication`

### 1.7. Добавить `approval_items`

Новая таблица:

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
  suggested_fix jsonb nullable
  created_at
  updated_at
  resolved_at nullable
```

`type`:

- `source_issue`
- `adaptation_quality_exception`
- `translation_fidelity_exception`
- `final_campaign_approval`
- `publishing_exception`

`status`:

- `pending`
- `approved`
- `changes_requested`
- `rejected`
- `blocked`
- `resolved`

### 1.8. Добавить `quality_check_results`

Новая таблица:

```text
quality_check_results
  id
  campaign_id
  planned_publication_id nullable
  artifact_type
  artifact_id
  artifact_version_id nullable
  check_type
  result
  attempt_number
  reasons jsonb
  suggested_fix jsonb nullable
  raw_ai_result jsonb nullable
  created_at
```

`check_type`:

- `source_guideline_check`
- `stage_1_adaptation_quality`
- `stage_2_translation_fidelity`

`result`:

- `passed`
- `warning`
- `failed`
- `blocked`

### 1.9. Добавить `workflow_runs`

Новая таблица:

```text
workflow_runs
  id
  campaign_id
  status
  current_step
  error_message nullable
  started_at
  completed_at nullable
  created_at
  updated_at
```

### 1.10. Добавить versioning для translation

Сейчас у adaptation versioning есть, у translation нет.

Добавить таблицу:

```text
translation_versions
  id
  translation_id
  content
  kind
  source_version_id nullable
  meta jsonb nullable
  created_at
```

`kind`:

- `generated`
- `ai_revision`
- `manual_edit`

### 1.11. Добавить source versioning

Чтобы source fixes были трассируемы, добавить:

```text
article_source_versions
  id
  article_id
  content
  language
  kind
  source_version_id nullable
  meta jsonb nullable
  created_at
```

`kind`:

- `original`
- `suggested_fix`
- `manual_edit`
- `accepted_source`

## Phase 2. Описать новые domain types и repositories

Цель: после миграций завести доменные модели и порты, но пока без сложной бизнес-логики.

### Куда класть

В `packages/project-management/src/domain/`:

- `campaign.aggregate.ts`
- `campaign-preset.aggregate.ts`
- `planned-publication.entity.ts`
- `campaign-artifact.entity.ts`
- `approval-item.aggregate.ts`
- `quality-check-result.entity.ts`
- `workflow-run.aggregate.ts`
- repository interfaces для каждой сущности

В `packages/editorial/src/domain/`:

- `translation-version.entity.ts`
- `translation-version.repository.ts`
- `article-source-version.entity.ts`
- `article-source-version.repository.ts`

### Что важно в домене

1. `Campaign` должен уметь менять high-level status.
2. `PlannedPublication` должна уметь менять production state.
3. `ApprovalItem` должен уметь идти по жизненному циклу `pending -> resolved`.
4. `WorkflowRun` должен хранить текущий шаг и финальный outcome.
5. `TranslationVersion` и `ArticleSourceVersion` не должны быть DTO-обертками, а полноценными сущностями version lineage.

## Phase 3. Реализовать Drizzle repositories и schema wiring

Цель: после доменных интерфейсов сразу поднять persistence, чтобы вся остальная логика уже писалась на реальных репозиториях.

### Что делаем

В `packages/infrastructure/src/project-management/`:

- `campaign-preset.drizzle-repository.ts`
- `campaign.drizzle-repository.ts`
- `planned-publication.drizzle-repository.ts`
- `campaign-artifact.drizzle-repository.ts`
- `approval-item.drizzle-repository.ts`
- `quality-check-result.drizzle-repository.ts`
- `workflow-run.drizzle-repository.ts`
- update existing `project.drizzle-repository.ts` for Brand Memory fields

В `packages/infrastructure/src/editorial/`:

- `translation-version.drizzle-repository.ts`
- `article-source-version.drizzle-repository.ts`

### Потом

Обновить `packages/infrastructure/src/infrastructure.module.ts`, чтобы все новые ports были связаны с адаптерами.

## Phase 4. Seed campaign presets

Цель: чтобы новый flow можно было сразу использовать без preset builder.

### Что делаем

Создаем seed на 3-5 системных preset-ов, например:

- `Market Insight`
- `Product Update`
- `Launch Burst`
- `Thought Leadership`

Для каждого preset сразу создаем конкретные `campaign_preset_publications`.

### Почему сейчас

Если preset-ов нет, нельзя закончить end-to-end flow и нельзя тестировать orchestration.

## Phase 5. Реализовать AI Gateway

Цель: прежде чем писать workflow, централизовать AI calls.

### Где

`packages/infrastructure/src/editorial/` или отдельная папка `packages/infrastructure/src/ai/`

### Минимальные компоненты

- `ai-gateway.port.ts`
- `ai-gateway.adapter.ts`
- operation registry or typed methods
- schema validation around outputs
- retry wrapper
- logging

### На MVP gateway должен уметь

- `validateSourceLongread`
- `adaptToTelegram`
- `adaptToX`
- `adaptToBlog`
- `checkAdaptationQuality`
- `reviseAdaptation`
- `translateAdaptation`
- `checkTranslationFidelity`
- `reviseTranslation`

### Чего не делать сейчас

- model routing engine
- dynamic prompt optimization
- self-learning
- experiments platform

## Phase 6. Реализовать source flow

Цель: научить campaign создавать canonical source и проводить source review.

### Use cases

В `packages/project-management/src/use-cases/`:

- `create-campaign/`
- `attach-campaign-source/`
- `start-campaign-production/`
- `review-source-issue/`

### Поведение

1. `CreateCampaign`
   - создает `Campaign`
   - копирует preset publications в `planned_publications`
   - материализует абсолютные `scheduled_for`

2. `AttachCampaignSource`
   - создает `Article` как canonical EN source
   - создает `article_source_versions` с `original`
   - создает `campaign_artifact` с ролью `canonical_longread_en`
   - привязывает article к campaign

3. `StartCampaignProduction`
   - создает `workflow_run`
   - переводит campaign в `source_checking`
   - запускает source guideline check

4. `ReviewSourceIssue`
   - позволяет принять suggested fix, вручную исправить, проигнорировать warning или заблокировать campaign
   - при принятом фиксe создает новую source version
   - после решения переводит campaign дальше в production

## Phase 7. Реализовать adaptation production

Цель: автоматом создавать base adaptations per planned publication.

### Use cases

В `packages/project-management/src/use-cases/`:

- `generate-base-adaptations-for-campaign/`
- `run-stage-1-for-planned-publication/`
- `resolve-adaptation-exception/`

### Поведение

Для каждой `planned_publication`:

1. Находим canonical EN article.
2. Генерируем base adaptation в EN под `channel + publication_type + style`.
3. Создаем `ChannelAdaptation`.
4. Создаем `AdaptationVersion`.
5. Создаем `CampaignArtifact` с ролью `base_adaptation_en`.
6. Запускаем Stage 1 loop.

### Stage 1 loop

1. `checkAdaptationQuality`
2. если `passed`
   - adaptation становится approved
   - `planned_publication` идет дальше
3. если `failed`
   - создается `quality_check_result`
   - вызывается `reviseAdaptation`
   - создается новая `AdaptationVersion`
   - повтор до 5 попыток
4. если после 5 попыток не прошло
   - создается `approval_item`
   - `planned_publication` становится `stage_1_failed`
   - `campaign` становится `needs_attention`

## Phase 8. Реализовать translation production

Цель: после успешного Stage 1 создавать translations only when needed.

### Use cases

В `packages/project-management/src/use-cases/`:

- `generate-translations-for-campaign/`
- `run-stage-2-for-planned-publication/`
- `resolve-translation-exception/`

### Поведение

1. Если `planned_publication.language = en`
   - translation не создается
   - planned publication помечается как `ready`

2. Если язык не `en`
   - создается `Translation`
   - создается `TranslationVersion`
   - создается `CampaignArtifact` с ролью `publishable_translation`
   - запускается Stage 2 loop

### Stage 2 loop

1. `checkTranslationFidelity`
2. если `passed`
   - translation становится approved
   - planned publication становится `ready`
3. если `failed`
   - пишется `quality_check_result`
   - вызывается `reviseTranslation`
   - создается новая `TranslationVersion`
   - retry до 5 попыток
4. если исчерпали попытки
   - создается `approval_item`
   - `planned_publication` становится `stage_2_failed`
   - `campaign` становится `needs_attention`

## Phase 9. Реализовать Approval Inbox

Цель: сделать human intervention только для exceptions.

### Use cases

В `packages/project-management/src/use-cases/`:

- `get-approval-inbox/`
- `approve-suggested-fix/`
- `request-rewrite/`
- `edit-artifact-manually/`
- `ignore-warning/`
- `block-planned-publication/`
- `approve-campaign-for-publishing/`
- `request-campaign-changes/`
- `cancel-campaign/`

### Логика

- `approval_items` являются единственным источником правды для inbox
- успешные adaptation and translation туда не попадают
- отдельный item создается для `final_campaign_approval`

### Критерий готовности

Когда нет unresolved exception items и все `planned_publications` в `ready`, campaign переходит в `ready_for_final_approval`.

## Phase 10. Привязать publishing к campaign flow

Цель: публикации больше не запускаются напрямую из article flow, а рождаются после final campaign approval.

### Что меняем

1. `ApproveCampaignForPublishing`
   - переводит campaign в `approved_for_publishing`
   - создает `Publication` или `PublicationPlan` для всех `planned_publications` в `ready`
   - создает `campaign_artifacts` c ролью `scheduled_publication`

2. publishing layer
   - продолжает исполнять публикацию как раньше
   - но теперь source of scheduling приходит из campaign flow

### Что лучше сделать в MVP

Использовать существующий `Publication`/`PublicationPlan`, но добавить campaign context:

- `planned_publication_id` в `publications`
- при необходимости `campaign_id` в `publications`

Это единственное место, где допустимо осознанно протянуть campaign linkage в existing execution model, потому что publishing status должен нормально отображаться на campaign screen.

## Phase 11. Реализовать basic metrics/status storage

Цель: без analytics platform, но с нормальной traceability.

### Вариант MVP

Либо расширить `publications`, либо добавить таблицу:

```text
publication_metrics
  id
  campaign_id
  planned_publication_id
  publication_id
  channel
  language
  external_post_id nullable
  impressions nullable
  likes nullable
  comments nullable
  clicks nullable
  collected_at
  created_at
```

Рекомендация: отдельная таблица лучше, потому что метрики приходят асинхронно и могут быть несколько раз собраны.

## Phase 12. Перестроить API

Цель: только после готового домена и persistence отдать новый transport flow.

### Новые API endpoints

В `apps/api/src/project-management/` или новой campaign-секции:

- `POST /projects/:projectId/campaigns`
- `GET /projects/:projectId/campaigns`
- `GET /campaigns/:campaignId`
- `POST /campaigns/:campaignId/start-production`
- `GET /campaigns/:campaignId/inbox`
- `POST /approval-items/:approvalItemId/approve-fix`
- `POST /approval-items/:approvalItemId/request-rewrite`
- `POST /approval-items/:approvalItemId/ignore`
- `POST /campaigns/:campaignId/final-approve`
- `POST /campaigns/:campaignId/cancel`
- `GET /campaign-presets`

### Project API

Расширить project endpoints для Brand Memory fields.

## Phase 13. Перестроить UI

Цель: UI не должен вести пользователя по старому article-first сценарию.

### Минимальные экраны

1. `Brand Memory setup/edit`
2. `Campaign list`
3. `Select preset`
4. `Create campaign`
5. `Campaign detail`
6. `Production status`
7. `Approval Inbox`
8. `Final approval`
9. `Publishing status`
10. `Basic metrics view`

### Порядок UI-внедрения

1. сначала `Campaign list` и `Create campaign`
2. потом `Campaign detail + production status`
3. потом `Approval Inbox`
4. потом `Final approval + publishing status`

Не надо сначала строить весь polished UX. Нужно сначала добиться рабочего end-to-end flow.

## Phase 14. Очереди и orchestration

Цель: production steps не должны висеть в HTTP request cycle.

### Что делаем

1. Каждый тяжелый шаг запускаем через worker:
   - source check
   - adaptation generation
   - adaptation revision
   - translation generation
   - translation revision
   - publishing

2. Workflow orchestration можно начать с simple handler + jobs pattern, без полной state machine framework.

### Правильный MVP-уровень

- use case меняет state
- enqueue job
- worker делает шаг
- worker пишет result
- при необходимости вызывает следующий use case

Не надо строить Temporal-подобную систему внутри MVP.

## Phase 15. Тесты

Цель: зафиксировать новый flow regression-safe.

### Что тестируем в первую очередь

1. `CreateCampaign`
2. materialization of `planned_publications`
3. source review flow
4. Stage 1 retry loop
5. Stage 2 retry loop
6. exception -> approval item creation
7. final approval gating before publishing
8. publication scheduling from ready planned publications

### Где тесты

- domain tests в `packages/project-management`
- repository tests в `packages/infrastructure`
- API integration tests в `apps/api`
- worker flow tests в `apps/worker`

## Recommended execution order

Если делать это как последовательность работы в ветке, оптимальный порядок такой:

1. Добавить DB schema и миграции
2. Добавить domain entities и repositories
3. Добавить infrastructure adapters
4. Засидить system presets
5. Реализовать AI Gateway
6. Реализовать `CreateCampaign`, `AttachCampaignSource`, `StartCampaignProduction`
7. Реализовать source review flow
8. Реализовать adaptation Stage 1 loop
9. Реализовать translation Stage 2 loop
10. Реализовать approval inbox
11. Привязать final approval к publishing
12. Добавить basic metrics
13. Открыть новые API endpoints
14. Перестроить UI под campaign flow
15. Довести тесты

## Что не делать раньше времени

- не рефакторить полностью старые article screens до готового campaign backend
- не строить universal agent framework
- не переносить learning loop в MVP
- не пытаться сразу сделать идеальную generalized workflow engine
- не убирать старые сущности, пока новый flow не работает end-to-end

## Definition of Ready для начала реализации

Можно начинать implementation, когда согласованы:

1. новый DB schema набор
2. список campaign statuses
3. список planned publication statuses
4. types and statuses for approval items
5. Stage 1 and Stage 2 retry policy
6. первые 3-5 system presets
7. минимальный contract AI Gateway

## Definition of Done для технической реализации

Технически этап можно считать завершенным, когда проходит сценарий:

1. Project хранит Brand Memory.
2. CMO создает Campaign из preset-а.
3. Система materialize-ит `planned_publications`.
4. CMO прикладывает EN source longread.
5. Source check либо пропускает кампанию дальше, либо создает source approval item.
6. Для каждой planned publication создается base adaptation EN.
7. Stage 1 auto-fix loop либо одобряет adaptation, либо создает exception item.
8. Для non-EN planned publications создается translation.
9. Stage 2 auto-fix loop либо одобряет translation, либо создает exception item.
10. Inbox содержит только exceptions и final approval.
11. До final approval публикации не создаются.
12. После final approval создаются scheduled publications or exports.
13. Campaign screen показывает publishing status и basic metrics.
