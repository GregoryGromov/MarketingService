# SEO Briefing Fallback And Rerun Policy

Этот документ фиксирует, как модуль `seo-briefing` должен реагировать на плохой результат, технический сбой или слабое качество данных на любом шаге pipeline.

## Главный принцип

Модуль не делает destructive rollback.

Правильная модель:

1. история не стирается;
2. старые artifacts и логи не удаляются;
3. downstream результаты помечаются как `superseded`, если мы переигрываем более ранний шаг;
4. новый прогон шага создается как новый `attempt`;
5. run движется вперед через retries, reruns и controlled fallback.

Иными словами:

- назад по логике мы иногда идем;
- назад по данным мы не откатываемся.

## Термины

### Retry same stage

Повторить тот же шаг с тем же входом.

Используется, когда:

- сетевой сбой;
- timeout;
- rate limit;
- временная ошибка провайдера;
- невалидный structured output;
- transient failure.

### Semantic rerun same stage

Повторить тот же шаг, но с новой попыткой prompt/constraints.

Используется, когда:

- результат формально валиден, но слаб по качеству;
- GPT вернул слишком шумный набор;
- кластеризация получилась слишком общей;
- brief получился слабым, но входные данные корректны.

### Fallback to previous checkpoint

Вернуться не на произвольную строку логики, а на один из заранее определенных checkpoint-ов pipeline.

Используется, когда:

- входных данных недостаточно;
- предыдущая стадия подготовила плохую основу;
- текущая стадия уперлась в слабый контекст, а не просто в неудачную генерацию.

### Reject / Needs Manual Review

Остановить automatic path, если:

- качество слишком слабое;
- data coverage недостаточен;
- product fit низкий по всем направлениям;
- стоимость дальнейших retry не оправдана;
- достигнут лимит fallback attempts.

## Checkpoint model

Разрешенные точки возврата должны быть ограничены.

Рекомендуемые checkpoint-ы:

### Checkpoint A. Input Snapshot

После:

- создания run-а;
- нормализации входа;
- сохранения `brand_memory_snapshot`.

### Checkpoint B. Keyword Research Snapshot

После:

- `keyword_expansion`
- `keyword_research`
- `related_keyword_research`

Это checkpoint, на котором уже есть рабочий keyword universe.

### Checkpoint C. SEO Evidence Snapshot

После:

- `serp_research`
- `domain_metrics_research`
- `onpage_research`

Это checkpoint, на котором уже есть evidence для competition и content gap.

### Checkpoint D. Cluster Snapshot

После:

- `keyword_triage`
- `clustering`

Это checkpoint, на котором уже есть cluster-ы и representative keywords.

### Checkpoint E. Decision Snapshot

После:

- `cluster_scoring`
- `cluster_selection`

Это checkpoint, на котором уже есть выбранный cluster и rejected alternatives.

### Checkpoint F. Brief Snapshot

После:

- `brief_generation`

## Базовый stage order

Рекомендуемый порядок стадий:

1. `created`
2. `keyword_expansion`
3. `keyword_research`
4. `related_keyword_research`
5. `serp_research`
6. `domain_metrics_research`
7. `onpage_research`
8. `keyword_triage`
9. `clustering`
10. `cluster_scoring`
11. `cluster_selection`
12. `brief_generation`
13. `done`

Технические конечные состояния:

- `failed`
- `rejected`
- `needs_manual_review`

## Правило superseded downstream state

Если мы возвращаемся на более ранний checkpoint, все downstream steps и результаты не удаляются, а помечаются как устаревшие.

Пример:

Если rerun идет с `related_keyword_research`, тогда устаревают:

- `serp_research`
- `domain_metrics_research`
- `onpage_research`
- `keyword_triage`
- `clustering`
- `cluster_scoring`
- `cluster_selection`
- `brief_generation`

Что делать технически:

1. сохранить старые steps;
2. пометить их `superseded`;
3. сохранить новые steps как новый `attempt`;
4. не терять старые GPT/external/scoring logs.

## Типы проблем и реакция системы

### Технический сбой

Примеры:

- network error;
- timeout;
- provider unavailable;
- rate limit;
- transient DB error.

Реакция:

1. `retry same stage`;
2. максимум 2-3 попытки;
3. после лимита -> `failed` или `needs_manual_review`.

### Невалидный structured output

Примеры:

- broken JSON;
- schema mismatch;
- missing mandatory field.

Реакция:

1. `semantic rerun same stage`;
2. усилить constraints;
3. после лимита -> `failed` или `needs_manual_review`.

### Формально валидный, но плохой semantic result

Примеры:

- keywords слишком общие;
- cluster-ы смешивают intent;
- product bridge притянут;
- brief weak, generic или переходит в article writing.

Реакция:

1. сначала `semantic rerun same stage`;
2. если видно, что проблема во входном контексте, fallback на предыдущий checkpoint;
3. после лимита -> `needs_manual_review`.

### Слабые данные

Примеры:

- нет нормального search volume;
- suggestions нерелевантны;
- мало SERP coverage;
- domain metrics неполные.

Реакция:

1. fallback на предыдущий research checkpoint;
2. если проблема не решается -> weak data penalty;
3. если автоматическое решение уже ненадежно -> `needs_manual_review`.

### Бизнес-отклонение

Примеры:

- все cluster-ы плохи по product fit;
- спрос слишком слабый;
- тема не дает нормального CTA bridge;
- высокая конкуренция по всем рабочим углам.

Реакция:

1. fallback на более ранний semantic checkpoint;
2. если improvement не найден -> `rejected` или `needs_manual_review`.

## Матрица допустимых возвратов по стадиям

### `keyword_expansion`

Проблемы:

- мало keyword hypotheses;
- слишком broad;
- слишком много бренд-нерелевантных гипотез;
- невалидный output.

Что можно делать:

1. retry same stage при технической ошибке;
2. semantic rerun same stage при слабом качестве;
3. возврат только в `Checkpoint A`, если нужно изменить входные данные.

Комментарий:

Это первый semantic step, поэтому обычно откатываться дальше некуда.

### `keyword_research`

Проблемы:

- DataForSEO не дал устойчивый ответ;
- volume слишком низкий почти по всем seeds;
- coverage слишком слабый.

Что можно делать:

1. retry same stage;
2. rerun `keyword_expansion`, если сами seeds слабые;
3. остаться на текущем keyword set и идти дальше только если coverage приемлем.

Когда откатываться на `keyword_expansion`:

- если менее условного минимума usable keywords;
- если почти все seeds не имеют спроса;
- если тема слишком широкая или слишком узкая.

### `related_keyword_research`

Проблемы:

- suggestions шумные;
- suggestions не добавляют новых осмысленных направлений;
- слишком много мусорных запросов;
- нет long-tail enrichment.

Что можно делать:

1. retry same stage;
2. semantic rerun same stage с меньшим списком seeds;
3. fallback на `keyword_expansion`, если исходная keyword universe бедная.

Когда достаточно идти дальше без отката:

- если есть приемлемый core keyword set даже без сильного enrichment.

### `serp_research`

Проблемы:

- не получен SERP по части keywords;
- SERP собран по неудачному shortlist;
- слишком высокая стоимость на текущем объеме.

Что можно делать:

1. retry same stage;
2. rerun same stage с более узким shortlist;
3. fallback на `Checkpoint B`, если нужно заново выбрать working keywords.

Когда нельзя идти дальше автоматически:

- если нет SERP по primary candidates для будущего selection.

### `domain_metrics_research`

Проблемы:

- не хватает domain metrics;
- часть доменов не покрыта;
- backlink data unreliable.

Что можно делать:

1. retry same stage;
2. rerun same stage по суженному набору domains;
3. продолжить с `weak_data_penalty`, если coverage частично приемлем;
4. остановиться в `needs_manual_review`, если competition model становится слишком слабой.

Когда не нужен полный откат:

- если есть SERP, но domain metrics частично отсутствуют, и это можно прозрачно отразить penalty.

### `onpage_research`

Проблемы:

- не удалось распарсить часть страниц;
- page structure неполная;
- content gap evidence слабый.

Что можно делать:

1. retry same stage;
2. rerun same stage по меньшему числу top pages;
3. продолжить дальше без полного onpage context.

Комментарий:

Это soft-degradable stage. Его отсутствие ухудшает brief, но не всегда должно ломать весь run.

### `keyword_triage`

Проблемы:

- keywords остались слишком шумными;
- mixed intent;
- неочевидно, что относится к теме.

Что можно делать:

1. semantic rerun same stage;
2. fallback на `Checkpoint B`, если проблема в бедном или грязном keyword set;
3. fallback на `Checkpoint C`, если triage завязан на SERP evidence и его не хватает.

### `clustering`

Проблемы:

- cluster-ы смешанные;
- один giant cluster вместо нескольких;
- отсутствуют рабочие supporting clusters;
- weak product angle segmentation.

Что можно делать:

1. semantic rerun same stage;
2. fallback на `keyword_triage`, если надо пересобрать shortlist;
3. fallback на `Checkpoint B`, если исходный keyword universe слабый.

Это один из ключевых шагов, где повтор одной стадии часто лучше полного отката.

### `cluster_scoring`

Проблемы:

- не хватает входных данных для формул;
- слишком высокий weak data penalty;
- расчеты показывают, что все cluster-ы некачественные;
- product fit слаб по всем вариантам.

Что можно делать:

1. retry same stage при технической ошибке;
2. fallback на `Checkpoint C`, если не хватает evidence;
3. fallback на `Checkpoint D`, если проблема в плохой кластеризации;
4. fallback на `Checkpoint B`, если problem root cause в keyword universe.

Когда не нужен откат:

- если scores валидны и просто показывают, что тема плохая. Тогда это не retry, а `rejected` или `needs_manual_review`.

### `cluster_selection`

Проблемы:

- лучший cluster все равно слишком слабый;
- сильный SEO cluster не имеет product fit;
- хороший product cluster не имеет спроса;
- все варианты ниже проходного порога.

Что можно делать:

1. semantic rerun same stage, если проблема в explanation, а не в логике;
2. fallback на `cluster_scoring`, если меняются thresholds или penalties;
3. fallback на `Checkpoint D`, если нужно пересобрать clusters;
4. fallback на `Checkpoint B`, если тема в принципе не дала нормальный candidate set.

Когда ставить `rejected`:

- если после лимита fallback attempts не найден рабочий cluster.

### `brief_generation`

Проблемы:

- brief слабый или generic;
- GPT ушел в article writing;
- плохой product placement;
- слабые competitor insights;
- невалидный structured output.

Что можно делать:

1. retry same stage при технической ошибке;
2. semantic rerun same stage при слабом brief;
3. fallback на `cluster_selection`, если проблема в выбранном угле;
4. fallback на `onpage_research`, если не хватает competitor/content gap evidence.

Когда не нужен откат далеко назад:

- если cluster выбран правильно, а проблема только в форме final brief.

## Hard blockers и soft-degradable stages

### Hard blockers

Без них run не должен автоматически доходить до final decision:

- `keyword_expansion`
- `keyword_research`
- `serp_research`
- `keyword_triage`
- `clustering`
- `cluster_scoring`
- `cluster_selection`
- `brief_generation`

### Soft-degradable

Можно продолжать с penalty или lower confidence:

- `related_keyword_research`
- `domain_metrics_research`
- `onpage_research`

Важно:

Продолжать без этих шагов можно только если это явно отражается в:

- score logs;
- weak data penalty;
- final confidence;
- evidence pack.

## Лимиты на retry и fallback

Рекомендуемые лимиты:

### Retry same stage

- технический retry: до `2`
- semantic rerun same stage: до `2`

### Backward fallback

- major fallback на предыдущий checkpoint: до `3` за весь run

### После лимита

Система должна:

1. не зациклиться;
2. пометить run как `needs_manual_review` или `rejected`;
3. сохранить все попытки и причины.

## Как помечать историю

Для каждого rerun нужно сохранять:

- `attempt`
- `trigger_reason`
- `fallback_from_stage`
- `fallback_to_stage_or_checkpoint`
- `superseded_step_ids`
- `created_at`

Это должно быть видно и в БД, и в audit trail.

## Decision logic для AI агента

Если агент реализует этот pipeline, он должен использовать такой порядок принятия решения:

1. Сначала понять, это technical failure или quality failure.
2. Если technical, сначала `retry same stage`.
3. Если quality failure, понять, проблема в текущем шаге или во входном контексте.
4. Если проблема локальна, делать `semantic rerun same stage`.
5. Если проблема upstream, идти на ближайший предыдущий checkpoint, а не наугад.
6. Если лимит fallback exhausted, не крутить loop бесконечно, а переводить run в `needs_manual_review` или `rejected`.

## Практическое правило

Чем ближе проблема к форме вывода, тем меньше глубина отката.

Примеры:

- Плохой JSON от GPT на `brief_generation` -> rerun `brief_generation`
- Плохой product placement в brief -> rerun `brief_generation`, иногда fallback на `cluster_selection`
- Плохой selected cluster -> fallback на `cluster_scoring` или `clustering`
- Нет нормальных cluster-ов вообще -> fallback на `keyword_triage` или `related_keyword_research`
- Вся тема слабая по спросу -> fallback на `keyword_expansion` или `rejected`

## Exit Criteria для политики

Эта policy считается принятой, если:

1. реализован checkpoint-based rerun, а не destructive rollback;
2. для каждой стадии понятен допустимый диапазон возврата;
3. downstream state помечается `superseded`, а не удаляется;
4. у retry и fallback есть лимиты;
5. бесконечные loops технически исключены.
