# Phase 7. Research Pipeline V1

## Цель

Собрать первый end-to-end run, который уже умеет делать keyword research, но еще не принимает финальных решений по cluster-ам.

## Scope

Входит:

- worker orchestration;
- stages до related keyword research;
- artifacts;
- step logs;
- GPT/external call logs.

Не входит:

- clustering;
- scoring;
- final selection;
- final brief.

## Стадии этой версии pipeline

- `created`
- `keyword_expansion`
- `keyword_research`
- `related_keyword_research`

## Что сделать

1. Реализовать `ProcessSeoBriefRun` executor.
2. Привязать worker job к executor.
3. На каждом шаге создавать или обновлять `seo_brief_run_steps`.
4. Вызывать AI для keyword expansion.
5. Вызывать DataForSEO для volume/suggestions.
6. Сохранять результаты как artifacts.
7. Обновлять run status по ходу выполнения.
8. Логировать каждый вызов GPT и DataForSEO.

## Deliverables

1. Рабочий асинхронный run.
2. Step timeline.
3. Keyword hypotheses.
4. Enriched keyword data.

## Что можно потрогать после фазы

1. Создать run.
2. Дождаться, пока worker его обработает.
3. Получить список keyword hypotheses.
4. Получить enriched data по keyword-ам.
5. Посмотреть все steps и call logs по run-у.

## Что нельзя делать в этой фазе

1. Не добавлять сюда cluster scoring.
2. Не генерировать brief.
3. Не делать сложный fallback loop.

## Exit Criteria

Фаза завершена, если:

1. run можно запустить end-to-end;
2. он доходит до конца research v1;
3. все шаги сохраняются в БД;
4. по run-у можно восстановить, что делал GPT и что делал DataForSEO.
