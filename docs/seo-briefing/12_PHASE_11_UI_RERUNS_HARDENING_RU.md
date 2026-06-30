# Phase 11. UI, Reruns And Hardening

## Цель

Сделать модуль пригодным для постоянного операционного использования, отладки и итераций.

## Разбиение фазы

Эту фазу лучше не делать одним большим куском. Ее стоит пройти в `3` подшага:

1. `Phase 11A` — read-only UI и trace visibility.
2. `Phase 11B` — reruns и manual review actions.
3. `Phase 11C` — operational hardening, cost control и regression safety.

## Scope

Входит:

- admin/test UI;
- run inspection UI;
- rerun tools;
- manual review;
- cost dashboard;
- hardening.

Не входит:

- новая бизнес-логика brief selection;
- новая domain model.

## Подшаг 11A. Read-Only UI And Trace Visibility

### Что сделать

1. Добавить UI запуска run-а.
2. Добавить UI списка run-ов.
3. Добавить UI страницы одного run-а:
   - status
   - steps
   - artifacts
   - LLM logs
   - external calls
   - scores
   - final brief
4. Добавить human-readable preview для final brief.
5. Добавить evidence pack preview.

### Deliverables

1. Экран запуска нового run-а.
2. Список run-ов.
3. Страница одного run-а с полным trace.
4. Preview final brief и evidence pack.

### Что можно потрогать после подшага

1. Запустить run через UI.
2. Открыть run и посмотреть всю историю шагов.
3. Открыть final brief без чтения сырых artifacts.
4. Открыть evidence pack и trail.

## Подшаг 11B. Reruns And Manual Review

### Что сделать

1. Добавить `rerun whole run`.
2. Добавить `rerun stage`.
3. Добавить `regenerate brief`.
4. Добавить manual review actions:
   - `needs_manual_review`
   - `rejected`
   - `approve for brief regeneration`
5. Добавить ручное изменение balance slider и повторный пересчет выбора.
6. Привязать UI к fallback/rerun policy из [13_FALLBACK_AND_RERUN_POLICY_RU.md](/Users/grigorijgromov/Desktop/Overnight/Projects/MarketingService/marketing-service/docs/seo-briefing/13_FALLBACK_AND_RERUN_POLICY_RU.md).

### Deliverables

1. Контролируемый rerun whole run.
2. Контролируемый rerun отдельного stage.
3. Manual review actions в UI.
4. Brief regenerate flow.

### Что можно потрогать после подшага

1. Повторить только один шаг, не трогая весь run.
2. Перегенерировать только brief.
3. Отправить run в manual review и вернуть его обратно в работу.
4. Изменить SEO/Product balance и получить новый selection result.

## Подшаг 11C. Operational Hardening And Cost Control

### Что сделать

1. Добавить cost dashboard.
2. Добавить metrics:
   - stage duration
   - total run duration
   - total LLM cost
   - total external cost
3. Доработать cache policy по DataForSEO.
4. Добавить deduplication похожих run-ов.
5. Добавить idempotency protections.
6. Добавить ограничения:
   - max initial keywords
   - max suggestion seeds
   - max clusters to score
   - max deep analysis clusters
   - max fallback attempts
7. Улучшить retry/idempotency behavior.
8. Добавить regression tests на scoring formulas и selection behavior.

### Deliverables

1. Cost visibility.
2. Stage/run metrics.
3. Deduplication и idempotency protections.
4. Regression safety suite.

### Что можно потрогать после подшага

1. Посмотреть стоимость и длительность run-а.
2. Убедиться, что дубликаты не плодят лишние run-ы.
3. Увидеть ограничение по глубине анализа или числу fallback attempts.
4. Прогнать regression suite на scoring и selection behavior.

## Deliverables

1. Usable internal UI.
2. Rerun tooling.
3. Cost visibility.
4. Operational safety improvements.

## Что можно потрогать после фазы

1. Запустить run через UI.
2. Посмотреть полный trace run-а.
3. Повторить только один шаг.
4. Перегенерировать только brief.
5. Посмотреть стоимость и длительность run-а.

## Что нельзя делать в этой фазе

1. Не превращать phase в бесконечный polish backlog.
2. Не переписывать core scoring без реальной причины.
3. Не ломать уже рабочий MVP ради “идеального UI”.

## Exit Criteria

Фаза завершена, если:

1. модуль удобен для ежедневной работы;
2. reruns контролируемы;
3. стоимость прозрачна;
4. отладка run-а возможна без чтения сырых логов вручную.
