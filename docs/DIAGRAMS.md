# Marketing Service — Diagrams

## 1. High-Level Architecture

```mermaid
graph TB
    subgraph clients["Clients"]
        admin["Admin UI"]
        ext["External Triggers"]
    end

    subgraph apps["Apps (Transport Layer)"]
        api["apps/api<br/><i>Fastify + NestJS</i>"]
        worker["apps/worker<br/><i>BullMQ Processors</i>"]
    end

    subgraph packages["Packages (Business Logic)"]
        subgraph bcs["Bounded Contexts"]
            pm["project-management<br/><i>domain + use-cases</i>"]
            ed["editorial<br/><i>domain + use-cases</i>"]
            pub["publishing<br/><i>domain + use-cases</i>"]
        end
        shared["shared<br/><i>DDD building blocks</i>"]
        infra["infrastructure<br/><i>adapters: repos, LLM,<br/>channel adapters</i>"]
        db_pkg["database<br/><i>Drizzle schemas +<br/>migrations</i>"]
    end

    subgraph external["External Systems"]
        pg[("PostgreSQL")]
        redis[("Redis")]
        openai["OpenAI API"]
        tg["Telegram API"]
        medium["Medium API"]
        blog["Blog CMS"]
    end

    admin -->|HTTP| api
    ext -->|HTTP| api
    api -->|enqueue jobs| redis
    redis -->|consume jobs| worker

    api --> pm & ed & pub
    worker --> ed & pub

    pm & ed & pub --> shared
    pm & ed & pub -.->|ports| infra
    infra --> db_pkg
    infra -->|Drizzle| pg
    infra -->|LLM adapter| openai
    infra -->|channel adapters| tg & medium & blog

    style clients fill:#e8f4f8,stroke:#5ba4cf
    style apps fill:#fef3c7,stroke:#f59e0b
    style bcs fill:#ede9fe,stroke:#8b5cf6
    style packages fill:#f0fdf4,stroke:#22c55e
    style external fill:#fef2f2,stroke:#ef4444
```

## 2. Bounded Contexts & Domain Model

```mermaid
graph LR
    subgraph pm_bc["Project Management"]
        direction TB
        project["<b>Project</b> (AR)<br/>─────────<br/>name<br/>brief: ProjectBrief"]
        channel["<b>Channel</b> (AR)<br/>─────────<br/>kind: telegram | medium | blog<br/>capabilities: ChannelCapabilities<br/>generationConfig: GenerationConfig"]
        rp["<b>ReleasePlan</b> (Entity)<br/>─────────<br/>languages[]<br/>schedule"]
        dest["<b>Destination</b> (Entity)<br/>─────────<br/>channelId<br/>config"]

        project -->|has many| rp
        project -->|has many| dest
    end

    subgraph ed_bc["Editorial"]
        direction TB
        article["<b>Article</b> (AR)<br/>─────────<br/>status: ArticleStatus<br/>paused: boolean<br/>releasePlanSnapshot"]
        original["<b>Original</b> (embedded)<br/>─────────<br/>content<br/>language<br/>uploadedAt"]
        adaptation["<b>ChannelAdaptation</b> (Entity)<br/>─────────<br/>channelId<br/>sourceLanguage<br/>status: NodeStatus<br/>adaptedContent"]
        translation["<b>Translation</b> (AR)<br/>─────────<br/>adaptationId<br/>language<br/>status: NodeStatus<br/>translatedContent"]

        article -->|embeds| original
        article -->|has many| adaptation
        adaptation -.->|triggers| translation
    end

    subgraph pub_bc["Publishing"]
        direction TB
        pubtarget["<b>PublishingTarget</b> (AR)<br/>─────────<br/>channelId<br/>config<br/>canEdit: boolean"]
        publication["<b>Publication</b> (AR)<br/>─────────<br/>status: PublicationStatus<br/>scheduledAt<br/>publishedAt<br/>targetLanguage<br/>contentSnapshot<br/>sourceRef<br/>externalId"]
    end

    project -.->|defines available channels| article
    article -.->|approved content →| publication
    pubtarget -.->|routes to| channel

    style pm_bc fill:#dbeafe,stroke:#3b82f6
    style ed_bc fill:#fce7f3,stroke:#ec4899
    style pub_bc fill:#d1fae5,stroke:#10b981
```

## 3. Dependency Graph (Packages)

```mermaid
graph BT
    shared["@marketing-service/<b>shared</b><br/><i>AggregateRoot, DomainEvent,<br/>Result, ValueObject, Id</i>"]

    pm["@marketing-service/<b>project-management</b>"]
    ed["@marketing-service/<b>editorial</b>"]
    pub["@marketing-service/<b>publishing</b>"]

    db["@marketing-service/<b>database</b><br/><i>Drizzle schemas</i>"]

    infra["@marketing-service/<b>infrastructure</b><br/><i>Drizzle repos, LLM adapter,<br/>channel adapters</i>"]

    api["apps/<b>api</b><br/><i>Controllers, Valibot schemas</i>"]
    worker["apps/<b>worker</b><br/><i>BullMQ processors</i>"]

    pm --> shared
    ed --> shared
    pub --> shared

    infra --> pm & ed & pub
    infra --> db

    api --> infra
    api --> pm & ed & pub
    worker --> infra
    worker --> ed & pub

    style shared fill:#f5f3ff,stroke:#7c3aed
    style db fill:#fef9c3,stroke:#ca8a04
    style infra fill:#ffedd5,stroke:#ea580c
    style api fill:#dbeafe,stroke:#2563eb
    style worker fill:#dbeafe,stroke:#2563eb
    style pm fill:#ede9fe,stroke:#8b5cf6
    style ed fill:#fce7f3,stroke:#ec4899
    style pub fill:#d1fae5,stroke:#10b981
```

## 4. Article Lifecycle (State Machine)

```mermaid
stateDiagram-v2
    [*] --> draft: CreateArticle

    draft --> ready: All required adaptations approved +<br/>translations ready
    draft --> cancelled: Cancel

    ready --> active: First publication scheduled
    ready --> cancelled: Cancel

    active --> active: More publications scheduled / published
    active --> completed: All planned publications finished

    cancelled --> [*]
    completed --> [*]

    state draft {
        [*] --> original_uploaded
        original_uploaded --> adaptations_generating: GenerateAdaptation
        adaptations_generating --> adaptations_ready: All approved
        adaptations_ready --> translations_generating: GenerateTranslation<br/><i>(saga)</i>
        translations_generating --> editorial_ready: All approved
    }
```

## 5. Content Pipeline (Data Flow)

```mermaid
sequenceDiagram
    actor User
    participant API as apps/api
    participant CmdBus as CommandBus
    participant Handler as Use Case Handler
    participant LLM as LLM (OpenAI)
    participant Queue as BullMQ / Redis
    participant Worker as apps/worker
    participant Channel as Channel Adapter
    participant DB as PostgreSQL

    User->>API: POST /articles {content, language}
    API->>CmdBus: CreateArticleCommand
    CmdBus->>Handler: execute()
    Handler->>DB: articleRepo.save(article)
    Handler-->>API: article.id

    User->>API: POST /articles/:id/generate-adaptations
    API->>Queue: enqueue(generate-adaptation)

    Queue->>Worker: job: generate-adaptation
    Worker->>CmdBus: GenerateAdaptationCommand
    CmdBus->>Handler: execute()
    Handler->>LLM: generate(original + brief)
    LLM-->>Handler: adapted content
    Handler->>DB: save adaptation
    Handler->>Handler: emit AdaptationGenerated

    User->>API: POST /adaptations/:id/approve
    API->>CmdBus: ApproveAdaptationCommand
    CmdBus->>Handler: execute()
    Handler->>DB: save(status=approved)
    Handler->>Handler: emit AdaptationApproved

    Note over Handler,Queue: Saga: AdaptationApproved<br/>→ GenerateTranslationsCommand

    Handler->>Queue: enqueue(generate-translation)
    Queue->>Worker: job: generate-translation
    Worker->>LLM: translate(adaptation, targetLang)
    LLM-->>Worker: translated content
    Worker->>DB: save translation

    User->>API: POST /articles/:id/publications {channel, language, scheduledAt}
    API->>CmdBus: CreatePublicationCommand
    CmdBus->>Handler: execute()
    Handler->>DB: save publication(contentSnapshot, scheduledAt)
    Handler->>Queue: delayed job: execute-publication

    Note over Queue: Waits until publication.scheduledAt...

    Queue->>Worker: job: execute-publication
    Worker->>Channel: publish(publication.contentSnapshot)
    Channel-->>Worker: externalId
    Worker->>DB: save(status=published)
```

## 6. Node Status (Adaptation / Translation)

```mermaid
stateDiagram-v2
    [*] --> pending: Create

    pending --> generated: LLM generates<br/>content
    generated --> edited: Human edits
    generated --> approved: Human approves<br/><i>(no edits needed)</i>
    edited --> approved: Human approves

    approved --> outdated: Original content<br/>changed

    outdated --> pending: Re-generate

    note right of approved: Required before<br/>article can be scheduled
```

## 7. Publication Status

```mermaid
stateDiagram-v2
    [*] --> scheduled: Schedule publication

    scheduled --> published: Channel API<br/>call succeeds
    scheduled --> failed: Channel API<br/>call fails
    scheduled --> cancelled: User cancels

    failed --> scheduled: Retry

    published --> published: Update content<br/><i>(if canEdit)</i>
```

## 8. Hexagonal Architecture (Ports & Adapters)

```mermaid
graph LR
    subgraph driving["Driving Adapters (apps/)"]
        ctrl["HTTP Controllers<br/><i>Fastify</i>"]
        proc["BullMQ Processors"]
    end

    subgraph core["Core (packages/BC)"]
        subgraph app_layer["Use Cases"]
            cmd["Command Handlers"]
            qry["Query Handlers"]
            saga["Sagas"]
        end
        subgraph domain["Domain"]
            ar["Aggregates"]
            vo["Value Objects"]
            evt["Domain Events"]
            ports_in["Ports (in):<br/>Repository interfaces<br/>Checker interfaces<br/>LLM port"]
        end
    end

    subgraph driven["Driven Adapters (packages/infrastructure)"]
        drizzle["Drizzle Repositories"]
        llm_adapter["OpenAI LLM Adapter"]
        ch_adapter["Channel Adapters<br/><i>Telegram, Medium, Blog</i>"]
    end

    subgraph ext["External"]
        pg[("PostgreSQL")]
        openai["OpenAI"]
        apis["Platform APIs"]
    end

    ctrl -->|Command / Query| cmd & qry
    proc -->|Command| cmd

    cmd --> ar
    qry --> ar
    saga -->|listens| evt
    saga -->|dispatches| cmd

    ar --> vo
    ar --> evt

    ports_in -.->|implemented by| drizzle & llm_adapter & ch_adapter

    drizzle --> pg
    llm_adapter --> openai
    ch_adapter --> apis

    style driving fill:#fef3c7,stroke:#f59e0b
    style core fill:#ede9fe,stroke:#8b5cf6
    style app_layer fill:#f5f3ff,stroke:#a78bfa
    style domain fill:#faf5ff,stroke:#c084fc
    style driven fill:#ffedd5,stroke:#ea580c
    style ext fill:#fef2f2,stroke:#ef4444
```
