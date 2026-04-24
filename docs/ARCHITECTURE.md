# Marketing Service — Architecture Cheat Sheet

## Quick Start

```bash
# 1. Поднять инфру
docker compose up -d

# 2. Установить зависимости
pnpm install

# 3. Запустить в dev-режиме (api + worker параллельно)
pnpm dev

# 4. API: http://localhost:3000
# 5. Линтинг
pnpm lint
pnpm lint:fix
```

---

## Tech Stack

| Что | Чем | Зачем |
|---|---|---|
| Framework | NestJS 11 | CQRS, DI, модули |
| HTTP | **Fastify** (`@nestjs/platform-fastify`) | 2x throughput vs Express |
| Очереди | **BullMQ** + Redis | LLM-генерация, публикация |
| ORM | **Drizzle** + `postgres` (postgres.js) | Type-safe SQL, тонкая абстракция |
| Валидация | **Valibot** | Легче Zod (~5KB), tree-shakeable, Standard Schema |
| Domain errors | **neverthrow** | `Result<T, E>` вместо throw |
| Pattern matching | **ts-pattern** | State machines, discriminated unions |
| ID | **typeid-js** | `article_01j5k...` — typed, time-sortable (UUIDv7) |
| Логи | **Pino** + `nestjs-pino` | Structured JSON, request context |
| Линтинг | **Biome** | Один инструмент (lint + format) |
| Тесты | **Vitest** + `unplugin-swc` | Быстро, ESM-native |

---

## Структура монорепо

```
marketing-service/
├── apps/
│   ├── api/                         # HTTP-слой (Fastify)
│   └── worker/                      # BullMQ-процессоры (без HTTP)
│
├── packages/
│   ├── shared/                      # DDD building blocks (без NestJS)
│   ├── database/                    # Drizzle: схема таблиц + миграции
│   ├── project-management/          # BC: domain + use-cases (чистый, без infra)
│   ├── editorial/                   # BC: domain + use-cases (чистый, без infra)
│   ├── publishing/                  # BC: domain + use-cases (чистый, без infra)
│   ├── infrastructure/              # ВСЕ адаптеры для всех BC (drizzle repos, LLM, channel adapters)
│   └── config-typescript/           # Shared tsconfig
```

### Принцип: куда что класть

```
packages/{bc}/src/
  domain/               — плоско: агрегаты, entities, VOs, events, repo-интерфейсы, checkers
  use-cases/            — vertical slices: command + handler + saga на use case

packages/infrastructure/src/
  {bc}/                 — адаптеры: Drizzle repos, LLM adapter, channel adapters
  database.module.ts    — @Global Drizzle provider
  infrastructure.module.ts — привязка port → adapter

apps/api/src/{bc}/
  *.controller.ts       — тонкий: validate → command → execute
  schemas/              — Valibot-схемы для request/response

apps/worker/src/processors/
  *.processor.ts        — тонкий: job data → command → execute
```

**Три слоя, три места:**
- **domain/ + use-cases/** → что и как (packages/{bc}) — **без infra-зависимостей**
- **infrastructure/** → чем (packages/infrastructure) — Drizzle, LLM, external APIs
- **apps/** → откуда (HTTP controllers, BullMQ processors) — transport-адаптеры

---

## Структура BC-пакета (на примере Editorial)

```
packages/editorial/src/
  domain/                                    # плоский domain layer
    article.aggregate.ts                     # агрегат
    original.entity.ts                       # entity внутри Article
    channel-adaptation.entity.ts             # entity внутри Article
    translation.aggregate.ts                 # отдельный агрегат
    article.repository.ts                    # интерфейс (порт) — ЭТО ДОМЕН
    translation.repository.ts               # интерфейс (порт)
    llm.port.ts                              # интерфейс LLM-адаптера
    translation-readiness.checker.ts         # доменный сервис
    events.ts                                # доменные события
    value-objects/
      cover.vo.ts
      language.vo.ts
      node-status.vo.ts
      release-plan-snapshot.vo.ts

  use-cases/                                 # application layer (vertical slices)
    create-article/
      create-article.command.ts
      create-article.handler.ts
    approve-adaptation/
      approve-adaptation.command.ts
      approve-adaptation.handler.ts
    generate-adaptation/
      generate-adaptation.command.ts
      generate-adaptation.handler.ts
    generate-translation/
      generate-translation.command.ts
      generate-translation.handler.ts
      on-adaptation-approved.saga.ts         # saga живёт рядом с use case, который запускает
    schedule-article/
      schedule-article.command.ts
      schedule-article.handler.ts
    get-article/
      get-article.query.ts
      get-article.handler.ts

  editorial.module.ts                        # NestJS module (handlers, sagas, checkers)
  index.ts
```

### Почему порты и чекеры в domain/

- **Repository interface** — это контракт агрегата на персистенцию. Агрегат определяет, как его сохранять. Это домен.
- **Checker** — чистый доменный сервис. Проверяет кросс-агрегатные инварианты. Чекер добывает данные, агрегат принимает решение.
- **LLM port** — интерфейс генерации. Домен знает что нужно сгенерировать, infra знает как.

---

## Структура Infrastructure-пакета

```
packages/infrastructure/src/
  project-management/
    project.drizzle-repository.ts
    channel.drizzle-repository.ts

  editorial/
    article.drizzle-repository.ts
    translation.drizzle-repository.ts
    llm.openai-adapter.ts                    # реализация LlmPort

  publishing/
    publication.drizzle-repository.ts
    publishing-target.drizzle-repository.ts
    channel-adapters/                        # ACL: один адаптер на channel.kind
      telegram.adapter.ts
      medium.adapter.ts
      blog.adapter.ts

  database.module.ts                         # @Global: DRIZZLE provider
  infrastructure.module.ts                   # привязка всех port → adapter
```

### Привязка port → adapter

```typescript
// packages/infrastructure/src/infrastructure.module.ts
@Module({
  imports: [DatabaseModule],
  providers: [
    // Editorial
    { provide: ArticleRepository, useClass: ArticleDrizzleRepository },
    { provide: TranslationRepository, useClass: TranslationDrizzleRepository },
    { provide: LlmPort, useClass: LlmOpenAiAdapter },
    // Publishing
    { provide: PublicationRepository, useClass: PublicationDrizzleRepository },
    // ...
  ],
  exports: [ArticleRepository, TranslationRepository, LlmPort, /* ... */],
})
export class InfrastructureModule {}
```

BC-модули **не знают** про адаптеры. Они инжектят порт (abstract class), InfrastructureModule подставляет реализацию.

---

## Паттерны и конвенции

### TypeID — генерация идентификаторов

```typescript
import { typeid } from 'typeid-js';

const articleId = typeid('article');   // → article_01j5k3f7z8n9...
const channelId = typeid('channel');   // → channel_01j5k3f7z8n9...

// В Drizzle-схеме: все ID как text
id: text('id').primaryKey(),           // хранит полную строку 'article_01j5k...'
```

### Valibot — валидация запросов

```typescript
// apps/api/src/editorial/schemas/create-article.schema.ts
import * as v from 'valibot';

export const CreateArticleSchema = v.object({
  projectId: v.pipe(v.string(), v.minLength(1)),
  content: v.pipe(v.string(), v.minLength(1)),
  language: v.pipe(v.string(), v.length(2)),
});

export type CreateArticleDto = v.InferOutput<typeof CreateArticleSchema>;
```

```typescript
// В контроллере
@Post()
async create(@Body(new ValibotPipe(CreateArticleSchema)) dto: CreateArticleDto) {
  return this.commandBus.execute(new CreateArticleCommand(dto));
}
```

### ValibotPipe — реализация

```typescript
import { type PipeTransform, type ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { type BaseSchema, type InferOutput, parse, ValiError } from 'valibot';

export class ValibotPipe<T extends BaseSchema<unknown, unknown, any>>
  implements PipeTransform
{
  constructor(private schema: T) {}

  transform(value: unknown, _metadata: ArgumentMetadata): InferOutput<T> {
    try {
      return parse(this.schema, value);
    } catch (error) {
      if (error instanceof ValiError) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: error.issues.map((issue) => ({
            path: issue.path?.map((p) => p.key).join('.'),
            message: issue.message,
          })),
        });
      }
      throw error;
    }
  }
}
```

### neverthrow — доменные ошибки

```typescript
import { ok, err, type Result } from 'neverthrow';

// В агрегате (domain/)
class Article {
  schedule(publishAt: Date, translationsReady: boolean): Result<void, DomainError> {
    if (!translationsReady) {
      return err(new TranslationsNotReadyError(this.id));
    }
    if (!this.allAdaptationsApproved()) {
      return err(new AdaptationsNotApprovedError(this.id));
    }
    this.status = 'scheduled';
    this.publishAt = publishAt;
    this.addEvent(new ArticleScheduled({ articleId: this.id, publishAt }));
    return ok(undefined);
  }
}
```

```typescript
// В command handler (use-cases/)
const result = article.schedule(command.publishAt, translationsReady);
if (result.isErr()) {
  throw result.error; // exception filter в apps/api подхватит → HTTP 422
}
await this.articleRepo.save(article);
```

### ts-pattern — state machines

```typescript
import { match } from 'ts-pattern';

const canTransition = match(currentStatus)
  .with('draft', () => ['scheduled', 'cancelled'])
  .with('scheduled', () => ['publishing', 'cancelled'])
  .with('publishing', () => ['published'])
  .otherwise(() => []);
```

### Drizzle — схема

```typescript
// packages/database/src/schema/editorial.schema.ts
import { pgTable, text, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';

export const articles = pgTable('articles', {
  id: text('id').primaryKey(),                    // TypeID: article_...
  projectId: text('project_id').notNull(),
  status: text('status').notNull().default('draft'),
  paused: boolean('paused').notNull().default(false),
  publishAt: timestamp('publish_at', { withTimezone: true }),
  defaultCoverUrl: text('default_cover_url'),
  originalContent: text('original_content').notNull(),
  originalLanguage: text('original_language').notNull(),
  originalUploadedAt: timestamp('original_uploaded_at', { withTimezone: true }).notNull(),
  releasePlanSnapshot: jsonb('release_plan_snapshot'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### Drizzle — DI в NestJS

```typescript
// packages/infrastructure/src/database.module.ts
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@marketing-service/database';

export const DRIZZLE = Symbol('DRIZZLE');
export type DrizzleDB = PostgresJsDatabase<typeof schema>;

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const client = postgres(config.getOrThrow<string>('DATABASE_URL'));
        return drizzle(client, { schema });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
```

```typescript
// В адаптере (packages/infrastructure/src/editorial/)
import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE, type DrizzleDB } from '../database.module';
import { articles } from '@marketing-service/database';
import { eq } from 'drizzle-orm';
import { ArticleRepository } from '@marketing-service/editorial';

@Injectable()
export class ArticleDrizzleRepository extends ArticleRepository {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) { super(); }

  async findById(id: string) {
    const rows = await this.db.select().from(articles).where(eq(articles.id, id));
    return rows[0] ?? null;
  }

  async save(article: Article) {
    await this.db.insert(articles).values(toRow(article))
      .onConflictDoUpdate({ target: articles.id, set: toRow(article) });
  }
}
```

### Use case — vertical slice

```
packages/editorial/src/use-cases/create-article/
├── create-article.command.ts    # Command DTO
└── create-article.handler.ts    # @CommandHandler — бизнес-логика
```

```typescript
// create-article.command.ts
export class CreateArticleCommand {
  constructor(
    public readonly projectId: string,
    public readonly content: string,
    public readonly language: string,
  ) {}
}
```

```typescript
// create-article.handler.ts
@CommandHandler(CreateArticleCommand)
export class CreateArticleHandler implements ICommandHandler<CreateArticleCommand> {
  constructor(
    private readonly articleRepo: ArticleRepository,  // порт из domain/
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateArticleCommand) {
    const article = Article.create({
      projectId: command.projectId,
      content: command.content,
      language: command.language,
    });
    await this.articleRepo.save(article);
    this.eventBus.publishAll(article.pullEvents());
    return article.id;
  }
}
```

### Aggregate Root — базовый класс

```typescript
// packages/shared/src/aggregate-root.ts
import type { DomainEvent } from './domain-event';

export abstract class AggregateRoot {
  private _domainEvents: DomainEvent[] = [];

  protected addEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  pullEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }
}
```

### NestJS CQRS Saga

```typescript
// packages/editorial/src/use-cases/generate-translation/on-adaptation-approved.saga.ts
@Injectable()
export class AdaptationApprovedSaga {
  @Saga()
  onAdaptationApproved = (events$: Observable<any>): Observable<any> => {
    return events$.pipe(
      ofType(AdaptationApprovedEvent),
      map(
        (event) =>
          new GenerateTranslationsCommand(event.adaptationId, event.targetLanguages),
      ),
    );
  };
}
```

### BullMQ Processor (worker)

```typescript
// apps/worker/src/processors/generation/generate-adaptation.processor.ts
@Processor('generation')
export class GenerateAdaptationProcessor extends WorkerHost {
  constructor(private readonly commandBus: CommandBus) { super(); }

  async process(job: Job<{ articleId: string; adaptationId: string }>) {
    await this.commandBus.execute(
      new GenerateAdaptationCommand(job.data.articleId, job.data.adaptationId),
    );
  }
}
```

### Controller (api)

```typescript
// apps/api/src/editorial/article.controller.ts
@Controller('articles')
export class ArticleController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async create(@Body(new ValibotPipe(CreateArticleSchema)) dto: CreateArticleDto) {
    const id = await this.commandBus.execute(
      new CreateArticleCommand(dto.projectId, dto.content, dto.language),
    );
    return { id };
  }
}
```

### Env Validation (Valibot)

```typescript
// apps/api/src/infrastructure/config/env.schema.ts
import * as v from 'valibot';

export const EnvSchema = v.object({
  NODE_ENV: v.picklist(['development', 'production', 'test']),
  PORT: v.pipe(v.string(), v.transform(Number), v.number()),
  DATABASE_URL: v.pipe(v.string(), v.url()),
  REDIS_URL: v.pipe(v.string(), v.url()),
});

export function validateEnv(config: Record<string, unknown>) {
  return v.parse(EnvSchema, config);
}
```

---

## BullMQ Queues

| Queue | Job | Что делает |
|---|---|---|
| `generation` | `generate-adaptation` | LLM: original + brief → adaptation (EN) |
| `generation` | `generate-translation` | LLM: adaptation → translation (target lang) |
| `publishing` | `execute-publication` | API call через channel adapter (delayed job) |
| `publishing` | `update-published` | Обновить контент через API (если canEdit) |

---

## Database Migrations

```bash
pnpm db:generate    # сгенерировать миграцию
pnpm db:migrate     # применить миграции
pnpm db:studio      # визуальный UI для БД
```

Схемы в `packages/database/src/schema/`. После изменения — `pnpm db:generate`.
Никогда не редактируй сгенерированные файлы в `packages/database/drizzle/`.

---

## Conventions

### Файлы

- `*.aggregate.ts` — агрегат (domain/)
- `*.entity.ts` — entity внутри агрегата (domain/)
- `*.vo.ts` — value object (domain/value-objects/)
- `*.repository.ts` — интерфейс репозитория (domain/) — **это домен**
- `*.port.ts` — интерфейс внешнего сервиса (domain/)
- `*.checker.ts` — доменный сервис (domain/)
- `*.command.ts` — CQRS command DTO (use-cases/)
- `*.query.ts` — CQRS query DTO (use-cases/)
- `*.handler.ts` — command/query handler (use-cases/)
- `*.saga.ts` — NestJS CQRS saga (use-cases/, рядом с command который запускает)
- `*.drizzle-repository.ts` — Drizzle-реализация (infrastructure/)
- `*.adapter.ts` — адаптер внешнего сервиса (infrastructure/)
- `*.controller.ts` — HTTP controller (apps/api/)
- `*.processor.ts` — BullMQ processor (apps/worker/)
- `*.schema.ts` — Valibot validation schema (apps/api/)
- `*.module.ts` — NestJS module
- `*.spec.ts` — тест

### Domain Events

Формат: `{Entity}{PastTenseVerb}` — `ArticleCreated`, `AdaptationApproved`, `PublicationSucceeded`

### Статусы (хранятся как text в БД)

**Article:** `draft → scheduled → publishing → published` (+ `cancelled` из draft/scheduled)

**Adaptation/Translation (NodeStatus):** `pending → generated → edited → approved → outdated`

**Publication:** `scheduled → published | failed | cancelled`

---

## Domain Services (Checkers)

Чекеры проверяют кросс-агрегатные инварианты. Чекер **добывает данные**, агрегат **принимает решение**.

```typescript
// packages/editorial/src/domain/translation-readiness.checker.ts (ИНТЕРФЕЙС)
export abstract class TranslationReadinessChecker {
  abstract areAllApproved(articleId: string): Promise<boolean>;
}

// packages/infrastructure/src/editorial/translation-readiness.drizzle-checker.ts (РЕАЛИЗАЦИЯ)
@Injectable()
export class TranslationReadinessDrizzleChecker extends TranslationReadinessChecker {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) { super(); }
  // ...
}

// В command handler (use-cases/)
const translationsReady = await this.checker.areAllApproved(articleId);
const result = article.schedule(publishAt, translationsReady);
```

---

## Testing

```bash
pnpm test              # unit-тесты (все packages + apps)
pnpm test:e2e          # e2e тесты (apps/api)
```

**Unit-тесты (domain):** Чистый TypeScript, без NestJS. Тестируют агрегаты и value objects.

```typescript
// packages/editorial/src/domain/__tests__/article.aggregate.spec.ts
describe('Article', () => {
  it('should transition from draft to scheduled', () => {
    const article = Article.create({ ... });
    const result = article.schedule(new Date(), true);
    expect(result.isOk()).toBe(true);
    expect(article.status).toBe('scheduled');
  });
});
```

**Integration-тесты:** `@nestjs/testing` + реальная тестовая БД.

**E2E-тесты:** HTTP-запросы к Fastify через `app.inject()`.

---

## Dependency Flow

```
                    packages/shared
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
       project-mgmt  editorial  publishing       packages/database
       (domain +      (domain +   (domain +       (Drizzle schemas)
        use-cases)     use-cases)  use-cases)          │
              │          │          │                   │
              └──────────┼──────────┘───────────────────┘
                         ▼
                packages/infrastructure        ← adapters (imports BC ports + database)
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
          apps/api              apps/worker    ← transport (imports everything)
```

BC-пакеты **не зависят** от database и infrastructure. Они чистые.
`packages/database` тоже независим — infrastructure импортирует и BC-пакеты, и database параллельно.
