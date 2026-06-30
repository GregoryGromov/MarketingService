# Phase 6. LLM Foundation

## Цель

Сделать AI-слой отдельным, управляемым и наблюдаемым адаптером, а не размазанной prompt-логикой по хендлерам.

## Scope

Входит:

- `SeoBriefAiPort`;
- structured AI methods;
- prompt versioning;
- GPT logging;
- JSON validation.

Не входит:

- orchestration pipeline;
- deterministic scoring;
- final run selection.

## Методы порта

Минимальный набор:

- `expandKeywords`
- `triageKeywords`
- `clusterKeywords`
- `buildProductBridge`
- `explainClusterSelection`
- `generateSeoBrief`

## Что сделать

1. Добавить `SeoBriefAiPort`.
2. Описать request/response contracts для каждого метода.
3. Реализовать adapter в `packages/infrastructure`.
4. Добавить prompt versioning.
5. Добавить strict response validation.
6. Добавить fallback handling для invalid structured output.
7. Интегрировать `seo_brief_llm_calls`.

## Deliverables

1. Порт для AI-операций.
2. Adapter.
3. Версионируемые prompt contracts.
4. LLM logs.

## Что можно потрогать после фазы

1. Отдельно вызвать keyword expansion.
2. Увидеть structured result.
3. Увидеть request/response в call log.
4. Увидеть prompt version и token usage.

## Что нельзя делать в этой фазе

1. Не считать score-ы через LLM.
2. Не прятать prompt version внутри adapter без логирования.
3. Не возвращать невалидный JSON “как есть”.

## Exit Criteria

Фаза завершена, если:

1. каждый AI метод вызывается отдельно;
2. response shape валидируется;
3. все вызовы логируются;
4. prompt version попадает в trail.
