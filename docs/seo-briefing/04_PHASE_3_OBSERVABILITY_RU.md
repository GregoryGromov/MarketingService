# Phase 3. Observability Foundation

## Цель

Сделать так, чтобы действия GPT, внешних API и scoring были видимыми и воспроизводимыми с самого начала.

## Почему эта фаза ранняя

Если observability добавить позже, вы получите рабочий, но непрозрачный pipeline, где:

- непонятно, что именно ответил GPT;
- непонятно, почему выбрался конкретный cluster;
- непонятно, сколько стоил run;
- непонятно, где произошла ошибка.

## Scope

Входит:

- DB logs для GPT;
- DB logs для внешних вызовов;
- DB logs для scoring;
- Pino structured logs;
- correlation ids.

Не входит:

- реальный DataForSEO adapter;
- реальный OpenAI adapter;
- UI dashboard.

## Таблицы

Минимум:

- `seo_brief_llm_calls`
- `seo_brief_external_calls`
- `seo_brief_score_logs`

## Что сделать

1. Добавить schema и миграции для этих трех таблиц.
2. Добавить repository interfaces.
3. Добавить Drizzle implementations.
4. Добавить common log payload contracts.
5. Добавить correlation model:
   - `run_id`
   - `step_id`
   - `operation`
   - `attempt`
6. Добавить thin logging services:
   - `SeoBriefLlmLogger`
   - `SeoBriefExternalCallLogger`
   - `SeoBriefScoreLogger`
7. Добавить structured Pino events для start/end/errors.

## Какие поля логировать

### Для GPT

- model
- prompt version
- request payload
- response payload
- token usage
- estimated cost
- latency
- status
- error message

### Для внешних вызовов

- provider
- endpoint
- request payload
- response payload
- cache hit
- latency
- estimated cost
- status
- error message

### Для scoring

- formula name
- inputs
- outputs
- timestamp

## Deliverables

1. Миграции для log tables.
2. Интерфейсы и реализации лог-репозиториев.
3. Единый logging layer в модуле.
4. Structured logs в приложении.

## Что можно потрогать после фазы

1. Ручная запись тестового GPT call log.
2. Ручная запись test external call log.
3. Ручная запись score log.
4. Чтение этих логов по `run_id`.

## Что нельзя делать в этой фазе

1. Не делать сразу UI dashboard.
2. Не писать здесь бизнес-формулы.
3. Не смешивать application logs и audit records в одну сущность.

## Exit Criteria

Фаза завершена, если:

1. есть отдельные log tables;
2. по run-у можно прочитать GPT trail;
3. по run-у можно прочитать external calls trail;
4. по run-у можно прочитать scoring trail;
5. correlation ids проходят через слой логирования.
