# Phase 2. Data Model And State Model

## Цель

Создать минимальную модель хранения run-ов, step-ов и результатов до интеграций.

## Почему эта фаза идет до реальных API вызовов

Если сначала начать дергать GPT и DataForSEO, а потом думать, куда класть результат, получится:

- потеря контекста;
- плохая воспроизводимость;
- слабая дебажность;
- хаотичные JSONB поля без статусов.

## Scope

Входит:

- таблицы run/state/result;
- run statuses;
- step statuses;
- базовые repositories.

Не входит:

- LLM logs;
- external call logs;
- scoring logs;
- интеграции.

## Таблицы

Минимальный набор:

- `seo_brief_runs`
- `seo_brief_run_steps`
- `seo_brief_run_artifacts`
- `seo_briefs`

## Что сделать

1. Добавить Drizzle schema для `seo_brief_runs`.
2. Добавить Drizzle schema для `seo_brief_run_steps`.
3. Добавить Drizzle schema для `seo_brief_run_artifacts`.
4. Добавить Drizzle schema для `seo_briefs`.
5. Добавить миграцию.
6. Добавить repository interfaces в `packages/seo-briefing`.
7. Добавить Drizzle repositories в `packages/infrastructure`.
8. Подключить repositories через `InfrastructureModule`.

## Рекомендуемые run statuses

- `created`
- `queued`
- `running`
- `done`
- `failed`
- `rejected`
- `needs_manual_review`

## Рекомендуемые step statuses

- `pending`
- `running`
- `completed`
- `failed`
- `skipped`

## Deliverables

1. Рабочая схема таблиц.
2. Миграция.
3. Интерфейсы репозиториев.
4. Drizzle-реализации.

## Что можно потрогать после фазы

1. Создать run в БД.
2. Создать step для run-а.
3. Прочитать run по id.
4. Увидеть artifact, привязанный к run-у.

## Что нельзя делать в этой фазе

1. Не добавлять сюда LLM logs.
2. Не добавлять сюда external call logs.
3. Не моделировать всю future analytics schema сразу.
4. Не тащить сюда raw DataForSEO models.

## Exit Criteria

Фаза завершена, если:

1. run создается и сохраняется;
2. step timeline можно прочитать из БД;
3. финальный brief можно сохранить отдельно от run-а;
4. schema отражает lifecycle, а не только storage.
