import type { EventBus } from '@nestjs/cqrs';
import {
  AdaptationVersionRepository,
  ArticleRepository,
  ArticleSourceVersionRepository,
  ChannelAdaptationRepository,
  TranslationRepository,
  TranslationVersionRepository,
  type AdaptationId,
  type AdaptationVersion,
  type AdaptationVersionId,
  type Article,
  type ArticleId,
  type ArticleSourceVersion,
  type ArticleSourceVersionId,
  type ChannelAdaptation,
  type ChannelId,
  type Translation,
  type TranslationId,
  type TranslationVersion,
  type TranslationVersionId,
} from '@marketing-service/editorial';
import type {
  DomainEvent,
} from '@marketing-service/shared';
import {
  AiGatewayPort,
  ApprovalItemRepository,
  CampaignArtifactRepository,
  CampaignFlowTransactionPort,
  CampaignPresetRepository,
  CampaignProductionJobPort,
  CampaignPublishingPort,
  CampaignRepository,
  PlannedPublicationRepository,
  ProjectRepository,
  QualityCheckResultRepository,
  WorkflowRunRepository,
  type AiGeneratedTextResult,
  type AiQualityCheckResult,
  type CampaignArtifact,
  type CampaignExportPlanRecord,
  type CampaignId,
  type CampaignPreset,
  type CampaignScheduledPublicationRecord,
  type CampaignScheduledPublicationRecord as ScheduledRecord,
  type Campaign,
  type EnqueuedCampaignProductionJob,
  type PlannedPublication,
  type Project,
  type QualityCheckResult,
  type ValidateSourceLongreadResult,
  type WorkflowRun,
} from '../index.js';

class InMemoryMapStore<T extends { id: string }> {
  readonly records = new Map<string, T>();

  constructor(initialValues: T[] = []) {
    initialValues.forEach((value) => this.records.set(value.id, value));
  }

  get(id: string): T | null {
    return this.records.get(id) ?? null;
  }

  set(value: T): void {
    this.records.set(value.id, value);
  }

  all(): T[] {
    return [...this.records.values()];
  }

  delete(id: string): void {
    this.records.delete(id);
  }
}

class InMemoryProjectRepository
  extends ProjectRepository
{
  private readonly store = new InMemoryMapStore<Project>();

  findById(id: string): Promise<Project | null> {
    return Promise.resolve(this.store.get(id));
  }

  findAll(): Promise<Project[]> {
    return Promise.resolve(this.store.all());
  }

  save(project: Project): Promise<void> {
    this.store.set(project);
    return Promise.resolve();
  }
}

class InMemoryCampaignPresetRepository
  extends CampaignPresetRepository
{
  private readonly store = new InMemoryMapStore<CampaignPreset>();

  findById(id: string): Promise<CampaignPreset | null> {
    return Promise.resolve(this.store.get(id));
  }

  findAll(): Promise<CampaignPreset[]> {
    return Promise.resolve(this.store.all());
  }

  findActiveSystemPresets(): Promise<CampaignPreset[]> {
    return Promise.resolve(
      this.store.all().filter((preset) => preset.isActive && preset.isSystem),
    );
  }

  save(preset: CampaignPreset): Promise<void> {
    this.store.set(preset);
    return Promise.resolve();
  }
}

class InMemoryCampaignRepository
  extends CampaignRepository
{
  private readonly store = new InMemoryMapStore<Campaign>();

  findById(id: string): Promise<Campaign | null> {
    return Promise.resolve(this.store.get(id));
  }

  findByProjectId(projectId: string): Promise<Campaign[]> {
    return Promise.resolve(
      this.store.all().filter((campaign) => campaign.projectId === projectId),
    );
  }

  save(campaign: Campaign): Promise<void> {
    this.store.set(campaign);
    return Promise.resolve();
  }
}

class InMemoryPlannedPublicationRepository
  extends PlannedPublicationRepository
{
  private readonly store = new InMemoryMapStore<PlannedPublication>();

  findById(id: string): Promise<PlannedPublication | null> {
    return Promise.resolve(this.store.get(id));
  }

  findByCampaignId(campaignId: CampaignId): Promise<PlannedPublication[]> {
    return Promise.resolve(
      this.store.all().filter((plannedPublication) => plannedPublication.campaignId === campaignId),
    );
  }

  findByCampaignIdAndStatus(campaignId: CampaignId, status: PlannedPublication['status']): Promise<PlannedPublication[]> {
    return Promise.resolve(
      this.store
        .all()
        .filter(
          (plannedPublication) =>
            plannedPublication.campaignId === campaignId &&
            plannedPublication.status === status,
        ),
    );
  }

  save(plannedPublication: PlannedPublication): Promise<void> {
    this.store.set(plannedPublication);
    return Promise.resolve();
  }

  saveMany(plannedPublications: PlannedPublication[]): Promise<void> {
    plannedPublications.forEach((plannedPublication) => this.store.set(plannedPublication));
    return Promise.resolve();
  }
}

class InMemoryCampaignArtifactRepository
  extends CampaignArtifactRepository
{
  private readonly store = new InMemoryMapStore<CampaignArtifact>();

  findById(id: string): Promise<CampaignArtifact | null> {
    return Promise.resolve(this.store.get(id));
  }

  findByCampaignId(campaignId: CampaignId): Promise<CampaignArtifact[]> {
    return Promise.resolve(
      this.store.all().filter((artifact) => artifact.campaignId === campaignId),
    );
  }

  findByCampaignIdAndRole(campaignId: CampaignId, role: string): Promise<CampaignArtifact[]> {
    return Promise.resolve(
      this.store
        .all()
        .filter((artifact) => artifact.campaignId === campaignId && artifact.role === role),
    );
  }

  findByPlannedPublicationId(plannedPublicationId: string): Promise<CampaignArtifact[]> {
    return Promise.resolve(
      this.store
        .all()
        .filter((artifact) => artifact.plannedPublicationId === plannedPublicationId),
    );
  }

  save(artifact: CampaignArtifact): Promise<void> {
    this.store.set(artifact);
    return Promise.resolve();
  }
}

class InMemoryApprovalItemRepository
  extends ApprovalItemRepository
{
  private readonly store = new InMemoryMapStore<any>();

  findById(id: string): Promise<any | null> {
    return Promise.resolve(this.store.get(id));
  }

  findByCampaignId(campaignId: CampaignId): Promise<any[]> {
    return Promise.resolve(
      this.store.all().filter((item) => item.campaignId === campaignId),
    );
  }

  findByCampaignIdAndStatus(campaignId: CampaignId, status: any): Promise<any[]> {
    return Promise.resolve(
      this.store
        .all()
        .filter((item) => item.campaignId === campaignId && item.status === status),
    );
  }

  save(item: any): Promise<void> {
    this.store.set(item);
    return Promise.resolve();
  }
}

class InMemoryQualityCheckResultRepository
  extends QualityCheckResultRepository
{
  private readonly store = new InMemoryMapStore<QualityCheckResult>();

  findById(id: string): Promise<QualityCheckResult | null> {
    return Promise.resolve(this.store.get(id));
  }

  findByCampaignId(campaignId: CampaignId): Promise<QualityCheckResult[]> {
    return Promise.resolve(
      this.store.all().filter((result) => result.campaignId === campaignId),
    );
  }

  findByArtifact(artifactType: QualityCheckResult['artifactType'], artifactId: string): Promise<QualityCheckResult[]> {
    return Promise.resolve(
      this.store
        .all()
        .filter(
          (result) => result.artifactType === artifactType && result.artifactId === artifactId,
        ),
    );
  }

  save(result: QualityCheckResult): Promise<void> {
    this.store.set(result);
    return Promise.resolve();
  }
}

class InMemoryWorkflowRunRepository
  extends WorkflowRunRepository
{
  private readonly store = new InMemoryMapStore<WorkflowRun>();

  findById(id: string): Promise<WorkflowRun | null> {
    return Promise.resolve(this.store.get(id));
  }

  findByCampaignId(campaignId: CampaignId): Promise<WorkflowRun[]> {
    return Promise.resolve(
      this.store.all().filter((workflowRun) => workflowRun.campaignId === campaignId),
    );
  }

  findActiveByCampaignId(campaignId: CampaignId): Promise<WorkflowRun | null> {
    return Promise.resolve(
      this.store
        .all()
        .find(
          (workflowRun) =>
            workflowRun.campaignId === campaignId && workflowRun.status === 'running',
        ) ?? null,
    );
  }

  save(workflowRun: WorkflowRun): Promise<void> {
    this.store.set(workflowRun);
    return Promise.resolve();
  }
}

class InMemoryArticleRepository
  extends ArticleRepository
{
  private readonly store = new InMemoryMapStore<Article>();

  findById(id: string): Promise<Article | null> {
    return Promise.resolve(this.store.get(id));
  }

  findByProjectId(projectId: string): Promise<Article[]> {
    return Promise.resolve(
      this.store.all().filter((article) => article.projectId === projectId),
    );
  }

  save(article: Article): Promise<void> {
    this.store.set(article);
    return Promise.resolve();
  }
}

class InMemoryArticleSourceVersionRepository
  extends ArticleSourceVersionRepository
{
  private readonly store = new InMemoryMapStore<ArticleSourceVersion>();

  findById(id: string): Promise<ArticleSourceVersion | null> {
    return Promise.resolve(this.store.get(id));
  }

  findByArticleId(articleId: ArticleId): Promise<ArticleSourceVersion[]> {
    return Promise.resolve(
      this.store.all().filter((version) => version.articleId === articleId),
    );
  }

  save(version: ArticleSourceVersion): Promise<void> {
    this.store.set(version);
    return Promise.resolve();
  }

  deleteByArticleIdExcept(articleId: ArticleId, keepIds: ArticleSourceVersionId[]): Promise<void> {
    const keep = new Set(keepIds);
    for (const version of this.store.all()) {
      if (version.articleId === articleId && !keep.has(version.id)) {
        this.store.records.delete(version.id);
      }
    }
    return Promise.resolve();
  }
}

class InMemoryChannelAdaptationRepository
  extends ChannelAdaptationRepository
{
  private readonly store = new InMemoryMapStore<ChannelAdaptation>();

  findById(id: AdaptationId): Promise<ChannelAdaptation | null> {
    return Promise.resolve(this.store.get(id));
  }

  findByArticleId(articleId: ArticleId): Promise<ChannelAdaptation[]> {
    return Promise.resolve(
      this.store.all().filter((adaptation) => adaptation.articleId === articleId),
    );
  }

  findByArticleIdAndChannelId(articleId: ArticleId, channelId: ChannelId): Promise<ChannelAdaptation | null> {
    return Promise.resolve(
      this.store
        .all()
        .find(
          (adaptation) =>
            adaptation.articleId === articleId && adaptation.channelId === channelId,
        ) ?? null,
    );
  }

  save(adaptation: ChannelAdaptation): Promise<void> {
    this.store.set(adaptation);
    return Promise.resolve();
  }
}

class InMemoryAdaptationVersionRepository
  extends AdaptationVersionRepository
{
  private readonly store = new InMemoryMapStore<AdaptationVersion>();

  findById(id: AdaptationVersionId): Promise<AdaptationVersion | null> {
    return Promise.resolve(this.store.get(id));
  }

  findByAdaptationId(adaptationId: AdaptationId): Promise<AdaptationVersion[]> {
    return Promise.resolve(
      this.store.all().filter((version) => version.adaptationId === adaptationId),
    );
  }

  save(version: AdaptationVersion): Promise<void> {
    this.store.set(version);
    return Promise.resolve();
  }

  deleteByAdaptationIdExcept(adaptationId: AdaptationId, keepIds: AdaptationVersionId[]): Promise<void> {
    const keep = new Set(keepIds);
    for (const version of this.store.all()) {
      if (version.adaptationId === adaptationId && !keep.has(version.id)) {
        this.store.records.delete(version.id);
      }
    }
    return Promise.resolve();
  }
}

class InMemoryTranslationRepository
  extends TranslationRepository
{
  private readonly store = new InMemoryMapStore<Translation>();

  findById(id: TranslationId): Promise<Translation | null> {
    return Promise.resolve(this.store.get(id));
  }

  findByAdaptationId(adaptationId: AdaptationId): Promise<Translation[]> {
    return Promise.resolve(
      this.store.all().filter((translation) => translation.adaptationId === adaptationId),
    );
  }

  findByAdaptationIdAndTargetLanguage(adaptationId: AdaptationId, targetLanguage: string): Promise<Translation | null> {
    const normalizedTargetLanguage = targetLanguage.toLowerCase();
    return Promise.resolve(
      this.store
        .all()
        .find(
          (translation) =>
            translation.adaptationId === adaptationId &&
            translation.targetLanguage === normalizedTargetLanguage,
        ) ?? null,
    );
  }

  save(translation: Translation): Promise<void> {
    this.store.set(translation);
    return Promise.resolve();
  }
}

class InMemoryTranslationVersionRepository
  extends TranslationVersionRepository
{
  private readonly store = new InMemoryMapStore<TranslationVersion>();

  findById(id: TranslationVersionId): Promise<TranslationVersion | null> {
    return Promise.resolve(this.store.get(id));
  }

  findByTranslationId(translationId: TranslationId): Promise<TranslationVersion[]> {
    return Promise.resolve(
      this.store.all().filter((version) => version.translationId === translationId),
    );
  }

  save(version: TranslationVersion): Promise<void> {
    this.store.set(version);
    return Promise.resolve();
  }

  deleteByTranslationIdExcept(translationId: TranslationId, keepIds: TranslationVersionId[]): Promise<void> {
    const keep = new Set(keepIds);
    for (const version of this.store.all()) {
      if (version.translationId === translationId && !keep.has(version.id)) {
        this.store.records.delete(version.id);
      }
    }
    return Promise.resolve();
  }
}

export class TestCampaignPublishingPort extends CampaignPublishingPort {
  readonly scheduledPublications = new Map<string, CampaignScheduledPublicationRecord>();
  readonly exportPlans = new Map<string, CampaignExportPlanRecord>();

  findScheduledPublication(plannedPublicationId: string): Promise<CampaignScheduledPublicationRecord | null> {
    return Promise.resolve(this.scheduledPublications.get(plannedPublicationId) ?? null);
  }

  findExportPlan(plannedPublicationId: string): Promise<CampaignExportPlanRecord | null> {
    return Promise.resolve(this.exportPlans.get(plannedPublicationId) ?? null);
  }

  async upsertScheduledPublication(
    params: any,
  ): Promise<CampaignScheduledPublicationRecord> {
    const existing = this.scheduledPublications.get(params.plannedPublicationId);
    const record: ScheduledRecord = existing ?? {
      id: `publication:${params.plannedPublicationId}`,
      plannedPublicationId: params.plannedPublicationId,
      status: 'scheduled',
      publishAt: params.publishAt,
      externalAccountRef: null,
      externalPostId: null,
      publishedAt: null,
      errorMessage: null,
    };

    record.publishAt = params.publishAt;
    this.scheduledPublications.set(params.plannedPublicationId, record);
    return record;
  }

  async upsertExportPlan(params: any): Promise<CampaignExportPlanRecord> {
    const existing = this.exportPlans.get(params.plannedPublicationId);
    const record: CampaignExportPlanRecord = existing ?? {
      id: `export:${params.plannedPublicationId}`,
      plannedPublicationId: params.plannedPublicationId,
      publishAt: params.publishAt,
    };

    record.publishAt = params.publishAt;
    this.exportPlans.set(params.plannedPublicationId, record);
    return record;
  }
}

export class TestCampaignProductionJobPort extends CampaignProductionJobPort {
  readonly sourceChecks: any[] = [];
  readonly stage1Jobs: any[] = [];
  readonly stage2Jobs: any[] = [];
  private nextId = 1;

  async enqueueSourceCheck(payload: any): Promise<EnqueuedCampaignProductionJob> {
    this.sourceChecks.push(payload);
    return { jobId: `job-${this.nextId++}` };
  }

  async enqueueStage1(payload: any): Promise<EnqueuedCampaignProductionJob> {
    this.stage1Jobs.push(payload);
    return { jobId: `job-${this.nextId++}` };
  }

  async enqueueStage2(payload: any): Promise<EnqueuedCampaignProductionJob> {
    this.stage2Jobs.push(payload);
    return { jobId: `job-${this.nextId++}` };
  }
}

export class TestAiGateway extends AiGatewayPort {
  readonly sourceValidationResults: ValidateSourceLongreadResult[] = [];
  readonly adaptationGenerationResults: AiGeneratedTextResult[] = [];
  readonly adaptationRevisionResults: AiGeneratedTextResult[] = [];
  readonly adaptationQualityResults: AiQualityCheckResult[] = [];
  readonly translationGenerationResults: AiGeneratedTextResult[] = [];
  readonly translationRevisionResults: AiGeneratedTextResult[] = [];
  readonly translationQualityResults: AiQualityCheckResult[] = [];

  private shift<T>(queue: T[], label: string): T {
    const next = queue.shift();
    if (!next) {
      throw new Error(`No queued AI gateway result for ${label}`);
    }

    return next;
  }

  validateSourceLongread(): Promise<ValidateSourceLongreadResult> {
    return Promise.resolve(this.shift(this.sourceValidationResults, 'validateSourceLongread'));
  }

  generateAdaptation(): Promise<AiGeneratedTextResult> {
    return Promise.resolve(this.shift(this.adaptationGenerationResults, 'generateAdaptation'));
  }

  reviseAdaptation(): Promise<AiGeneratedTextResult> {
    return Promise.resolve(this.shift(this.adaptationRevisionResults, 'reviseAdaptation'));
  }

  generateTranslation(): Promise<AiGeneratedTextResult> {
    return Promise.resolve(this.shift(this.translationGenerationResults, 'generateTranslation'));
  }

  reviseTranslation(): Promise<AiGeneratedTextResult> {
    return Promise.resolve(this.shift(this.translationRevisionResults, 'reviseTranslation'));
  }

  checkAdaptationQuality(): Promise<AiQualityCheckResult> {
    return Promise.resolve(this.shift(this.adaptationQualityResults, 'checkAdaptationQuality'));
  }

  checkTranslationFidelity(): Promise<AiQualityCheckResult> {
    return Promise.resolve(this.shift(this.translationQualityResults, 'checkTranslationFidelity'));
  }
}

class InMemoryCampaignFlowTransaction extends CampaignFlowTransactionPort {
  constructor(private readonly context: any) {
    super();
  }

  run<T>(work: (context: any) => Promise<T>): Promise<T> {
    return work(this.context);
  }
}

export interface CampaignTestContext {
  repositories: {
    projects: InMemoryProjectRepository;
    presets: InMemoryCampaignPresetRepository;
    campaigns: InMemoryCampaignRepository;
    plannedPublications: InMemoryPlannedPublicationRepository;
    artifacts: InMemoryCampaignArtifactRepository;
    approvals: InMemoryApprovalItemRepository;
    qualityChecks: InMemoryQualityCheckResultRepository;
    workflowRuns: InMemoryWorkflowRunRepository;
    articles: InMemoryArticleRepository;
    articleSourceVersions: InMemoryArticleSourceVersionRepository;
    adaptations: InMemoryChannelAdaptationRepository;
    adaptationVersions: InMemoryAdaptationVersionRepository;
    translations: InMemoryTranslationRepository;
    translationVersions: InMemoryTranslationVersionRepository;
  };
  transaction: CampaignFlowTransactionPort;
  jobs: TestCampaignProductionJobPort;
  aiGateway: TestAiGateway;
  publishing: TestCampaignPublishingPort;
  eventBus: EventBus;
  publishedEvents: DomainEvent[];
}

export function createCampaignTestContext(): CampaignTestContext {
  const repositories = {
    projects: new InMemoryProjectRepository(),
    presets: new InMemoryCampaignPresetRepository(),
    campaigns: new InMemoryCampaignRepository(),
    plannedPublications: new InMemoryPlannedPublicationRepository(),
    artifacts: new InMemoryCampaignArtifactRepository(),
    approvals: new InMemoryApprovalItemRepository(),
    qualityChecks: new InMemoryQualityCheckResultRepository(),
    workflowRuns: new InMemoryWorkflowRunRepository(),
    articles: new InMemoryArticleRepository(),
    articleSourceVersions: new InMemoryArticleSourceVersionRepository(),
    adaptations: new InMemoryChannelAdaptationRepository(),
    adaptationVersions: new InMemoryAdaptationVersionRepository(),
    translations: new InMemoryTranslationRepository(),
    translationVersions: new InMemoryTranslationVersionRepository(),
  };
  const publishing = new TestCampaignPublishingPort();
  const transaction = new InMemoryCampaignFlowTransaction({
    projectRepository: repositories.projects,
    campaignPresetRepository: repositories.presets,
    campaignRepository: repositories.campaigns,
    plannedPublicationRepository: repositories.plannedPublications,
    campaignArtifactRepository: repositories.artifacts,
    approvalItemRepository: repositories.approvals,
    qualityCheckResultRepository: repositories.qualityChecks,
    workflowRunRepository: repositories.workflowRuns,
    articleRepository: repositories.articles,
    articleSourceVersionRepository: repositories.articleSourceVersions,
    channelAdaptationRepository: repositories.adaptations,
    adaptationVersionRepository: repositories.adaptationVersions,
    translationRepository: repositories.translations,
    translationVersionRepository: repositories.translationVersions,
    campaignPublishingPort: publishing,
  });
  const aiGateway = new TestAiGateway();
  const jobs = new TestCampaignProductionJobPort();
  const publishedEvents: DomainEvent[] = [];
  const eventBus = {
    publishAll(events: DomainEvent[] = []) {
      publishedEvents.push(...events);
    },
  } as EventBus;

  return {
    repositories,
    transaction,
    jobs,
    aiGateway,
    publishing,
    eventBus,
    publishedEvents,
  };
}
