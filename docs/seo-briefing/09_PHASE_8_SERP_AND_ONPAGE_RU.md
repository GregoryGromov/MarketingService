# Phase 8. SERP, Domain Metrics And OnPage Research

## Цель

Расширить research pipeline фактами о конкурентной выдаче и структуре контента конкурентов.

## Почему это отдельная фаза

Потому что:

- это другой cost profile;
- это другой набор endpoint-ов;
- это другой тип payload;
- это создает основу для later scoring и content gap logic.

## Scope

Входит:

- `serp_research`;
- `domain_metrics_research`;
- `onpage_research`.

Не входит:

- clustering;
- final score formulas;
- brief generation.

## Что сделать

1. Добавить стадию `serp_research`.
2. Добавить стадию `domain_metrics_research`.
3. Добавить стадию `onpage_research`.
4. Определить, по каким keywords вызывать SERP:
   - все или shortlisted;
   - по лимитам стоимости.
5. Сохранять SERP results как artifacts.
6. Сохранять domain metrics как artifacts.
7. Сохранять parsed competitor structure как artifacts.
8. Логировать стоимость и latency этих вызовов.

## Deliverables

1. SERP context по выбранным keywords.
2. Domain metrics inputs для competition model.
3. OnPage/competitor page structure context.

## Что можно потрогать после фазы

1. Посмотреть top results по representative keywords.
2. Посмотреть домены и их strength inputs.
3. Посмотреть H1/H2/H3/FAQ контекст конкурентных страниц.
4. Увидеть, сколько это стоит на один run.

## Что нельзя делать в этой фазе

1. Не превращать onpage parsing в crawler.
2. Не делать полную content analysis платформу.
3. Не делать selection logic прямо здесь.

## Exit Criteria

Фаза завершена, если:

1. run умеет собирать SERP контекст;
2. умеет собирать domain metrics;
3. умеет собирать page structure для later brief generation;
4. все это сохраняется и логируется по run-у.
