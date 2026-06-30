# Phase 10. Brief Generation And Evidence Pack

## Цель

Довести модуль до состояния, когда он возвращает не просто decision, а полноценный SEO brief с объясняющим evidence pack.

## Scope

Входит:

- final cluster selection stage;
- structured brief generation;
- final brief persistence;
- human-readable preview data;
- evidence pack assembly.

Не входит:

- сложный UI;
- rerun tools;
- manual review flow.

## Что сделать

1. Реализовать stage `brief_generation`.
2. Передавать в LLM весь нужный research context по выбранному cluster.
3. Генерировать structured brief:
   - topic
   - SEO title
   - meta description
   - H1/H2/H3 outline
   - FAQ
   - product placement
   - rejected/postponed clusters
4. Сохранять final brief в `seo_briefs`.
5. Формировать evidence pack как читаемую сборку данных по run-у.
6. Добавить API чтения final brief и evidence.

## Deliverables

1. Final brief JSON.
2. Stored brief document.
3. Evidence pack.
4. LLM/external/scoring trail, связанный с этим brief.

## Что можно потрогать после фазы

1. Открыть финальный brief по run-у.
2. Получить JSON и preview payload.
3. Посмотреть, на каком cluster построен brief.
4. Посмотреть trail, из которого этот brief был собран.

## Definition of Done

Фаза завершена, если run возвращает:

1. selected cluster;
2. primary and secondary keywords;
3. SEO score;
4. Product score;
5. competition score;
6. selected angle;
7. structured brief;
8. rejected/postponed clusters with reasons;
9. evidence pack;
10. timeline действий GPT и внешних вызовов.

## Что нельзя делать в этой фазе

1. Не писать финальную статью.
2. Не прятать evidence.
3. Не выбрасывать rejected clusters из результата.

## Exit Criteria

Фаза завершена, если:

1. у маркетолога есть готовый brief;
2. у команды есть evidence trail;
3. решение можно объяснить и перепроверить.
