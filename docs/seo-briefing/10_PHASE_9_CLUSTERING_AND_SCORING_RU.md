# Phase 9. Clustering, Scoring And Selection

## Цель

Превратить research из “набора данных” в объяснимое решение о том, какой cluster стоит выбрать.

## Scope

Входит:

- keyword triage;
- clustering;
- representative keyword selection;
- deterministic scoring;
- decision labels;
- базовый fallback.

Не входит:

- final brief generation;
- UI review;
- rich rerun tooling.

## Что делает AI

- triage;
- clustering;
- product bridge suggestions;
- semantic explanation.

## Что делает код

- numeric score calculation;
- penalties;
- weight redistribution;
- final selection;
- fallback routing;
- score logging.

## Что сделать

1. Реализовать AI keyword triage.
2. Реализовать AI clustering.
3. Реализовать representative keyword selection rules.
4. Реализовать pure scoring services:
   - `DemandScoreService`
   - `CompetitionScoreService`
   - `SeoScoreService`
   - `ProductScoreService`
   - `FinalClusterScoreService`
5. Реализовать decision labels.
6. Реализовать базовый fallback policy.
7. Логировать каждую формулу в `seo_brief_score_logs`.
8. Сохранять cluster payloads как artifacts.

## Deliverables

1. Cluster list по run-у.
2. Numeric scores.
3. Selected cluster.
4. Rejected/postponed clusters.
5. Score logs.

## Что можно потрогать после фазы

1. Посмотреть clusters.
2. Посмотреть score breakdown.
3. Посмотреть selected cluster.
4. Посмотреть, какой penalty применился и почему.

## Что нельзя делать в этой фазе

1. Не давать LLM считать итоговый numeric score.
2. Не скрывать scoring inputs.
3. Не генерировать final brief до завершения selection logic.

## Exit Criteria

Фаза завершена, если:

1. run умеет выбрать cluster;
2. этот выбор объясним через logs и artifacts;
3. score-ы считаются кодом;
4. rejected clusters имеют явные причины.
