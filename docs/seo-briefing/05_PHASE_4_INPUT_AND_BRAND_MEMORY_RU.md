# Phase 4. Input Layer And Brand Memory Snapshot

## Цель

Сделать корректный вход в модуль и воспроизводимый snapshot контекста.

## Почему это отдельная фаза

Потому что без правильного входа нельзя гарантировать:

- повторяемость run-а;
- корректный Product Fit;
- объяснимость результата;
- стабильность между rerun и future project changes.

## Scope

Входит:

- input DTO;
- command создания run-а;
- нормализация входа;
- чтение `brand memory`;
- сохранение snapshot.

Не входит:

- DataForSEO;
- GPT;
- orchestration worker.

## Что сделать

1. Реализовать `BrandMemoryReaderPort`.
2. Реализовать adapter, который читает `brand memory` через текущий `ProjectRepository`.
3. Добавить command `CreateSeoBriefRun`.
4. Добавить handler создания run-а.
5. Нормализовать вход:
   - country
   - language
   - weights
   - product fields
   - audience shift
6. Сохранять `brand_memory_snapshot` внутрь run-а.
7. Сохранять normalized input как artifact.

## Рекомендуемая форма входа

На старте run должен содержать:

- `topic_seed`
- `country`
- `language`
- `audience`
- `product_name`
- `product_description`
- `key_message`
- `audience_before`
- `audience_after`
- `cta`
- `seo_weight`
- `product_weight`
- `brand_memory_snapshot`

## Deliverables

1. `CreateSeoBriefRun` use case.
2. Input validation schema.
3. `BrandMemoryReaderPort`.
4. Adapter чтения brand memory.
5. Snapshot в БД.

## Что можно потрогать после фазы

1. Создать run по `projectId`.
2. Увидеть, что `brand_memory_snapshot` сохранился в run-е.
3. Увидеть normalized input artifact.
4. Повторно прочитать run без обращения к живому проекту.

## Что нельзя делать в этой фазе

1. Не читать `Project` aggregate прямо в application services.
2. Не тянуть туда все поле `Project`, если нужен только brand context.
3. Не запускать GPT.
4. Не запускать DataForSEO.

## Exit Criteria

Фаза завершена, если:

1. run можно создать через API или command;
2. он содержит snapshot brand memory;
3. вход нормализуется единообразно;
4. дальнейший pipeline может работать без повторного чтения проекта.
