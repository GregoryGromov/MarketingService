# Phase 1. Module Shell

## Цель

Создать минимальный технический каркас модуля, чтобы он появился в системе как отдельная вертикаль.

## Почему эта фаза отдельно

AI агенту проще двигаться, когда:

- модуль уже существует;
- есть точка входа в API;
- есть точка входа в worker;
- есть место, куда дальше складывать код.

## Scope

Входит:

- новый пакет;
- новый Nest module;
- новый controller shell;
- новый worker shell.

Не входит:

- DB schema;
- логирование;
- бизнес-логика;
- интеграции.

## Какие директории и файлы создать

Минимум:

```text
packages/seo-briefing/src/seo-briefing.module.ts
packages/seo-briefing/src/index.ts
apps/api/src/seo-briefing/seo-brief.controller.ts
apps/api/src/seo-briefing/schemas/
apps/worker/src/processors/seo-brief-run.worker.ts
```

## Что сделать

1. Создать пакет `packages/seo-briefing`.
2. Подключить его в workspace/build graph.
3. Создать пустой `SeoBriefingModule`.
4. Подключить этот module в API app.
5. Создать controller с `ping` или `health` endpoint.
6. Создать пустой processor в worker app.
7. Проверить, что сборка не ломается.

## Deliverables

1. Новый пакет в монорепо.
2. Подключенный module в API.
3. Подключенный shell в worker.
4. Один минимальный HTTP endpoint.

## Что можно потрогать после фазы

1. Открыть endpoint модуля и получить ответ.
2. Увидеть новый пакет в репозитории.
3. Убедиться, что worker знает про новый processor.

## Что нельзя делать в этой фазе

1. Не писать миграции.
2. Не писать command handlers с реальной логикой.
3. Не писать adapter-ы.
4. Не смешивать shell и domain.

## Exit Criteria

Фаза завершена, если:

1. модуль существует в коде;
2. он подключен в API;
3. для него есть shell в worker;
4. build/typecheck не ломаются.
