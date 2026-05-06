import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  AddAdaptationCommand,
  AddTranslationCommand,
  ApproveAdaptationCommand,
  ApproveTranslationCommand,
  type AdaptationId,
  CreateArticleCommand,
  EditAdaptationCommand,
  EditTranslationCommand,
  GenerateAdaptationCommand,
  GenerateTranslationCommand,
  GetArticleQuery,
  ListProjectArticlesQuery,
  ReviseAdaptationSelectionCommand,
  SelectAdaptationVersionCommand,
  type ArticleId,
  type AdaptationVersionId,
  type ChannelId,
  type ProjectId,
  type TranslationId,
} from '@marketing-service/editorial';
import { ValibotPipe } from '../infrastructure/common/valibot-validation.pipe';
import {
  CreateArticleSchema,
} from './schemas/create-article.schema';
import type { CreateArticleDto } from './schemas/create-article.schema';

@Controller('articles')
export class ArticleController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async create(
    @Body(new ValibotPipe(CreateArticleSchema)) dto: CreateArticleDto,
  ): Promise<{ id: string }> {
    const id = await this.commandBus.execute(
      new CreateArticleCommand(
        dto.projectId as ProjectId,
        dto.content,
        dto.language,
        dto.releasePlanSnapshot ?? null,
      ),
    );

    return { id };
  }

  @Get()
  async listByProject(
    @Query('projectId') projectId: string,
  ) {
    if (!projectId?.trim()) {
      return [];
    }

    return this.queryBus.execute(
      new ListProjectArticlesQuery(projectId.trim() as ProjectId),
    );
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const article = await this.queryBus.execute(new GetArticleQuery(id as ArticleId));

    if (!article) {
      throw new NotFoundException(`Article ${id} not found`);
    }

    return article;
  }

  @Post(':id/adaptations')
  async addAdaptation(
    @Param('id') id: string,
    @Body() body: { channelId: string; displayName?: string; promptInstructions?: string | null },
  ): Promise<{ id: string }> {
    const adaptationId = await this.commandBus.execute(
      new AddAdaptationCommand(
        id as ArticleId,
        body.channelId as ChannelId,
        body.displayName?.trim() || body.channelId,
        body.promptInstructions?.trim() || null,
      ),
    );

    return { id: adaptationId };
  }

  @Post(':articleId/adaptations/:adaptationId/edit')
  async editAdaptation(
    @Param('articleId') articleId: string,
    @Param('adaptationId') adaptationId: string,
    @Body() body: { adaptedContent: string },
  ): Promise<{ ok: true }> {
    await this.commandBus.execute(
      new EditAdaptationCommand(
        articleId as ArticleId,
        adaptationId as AdaptationId,
        body.adaptedContent,
      ),
    );

    return { ok: true };
  }

  @Post(':articleId/adaptations/:adaptationId/generate')
  async generateAdaptation(
    @Param('articleId') articleId: string,
    @Param('adaptationId') adaptationId: string,
  ): Promise<{ adaptedContent: string }> {
    const adaptedContent = await this.commandBus.execute(
      new GenerateAdaptationCommand(
        articleId as ArticleId,
        adaptationId as AdaptationId,
      ),
    );

    return { adaptedContent };
  }

  @Post(':articleId/adaptations/:adaptationId/revise-selection')
  async reviseAdaptationSelection(
    @Param('articleId') articleId: string,
    @Param('adaptationId') adaptationId: string,
    @Body() body: { currentContent: string; selectedText: string; instruction: string },
  ): Promise<{ adaptedContent: string }> {
    const adaptedContent = await this.commandBus.execute(
      new ReviseAdaptationSelectionCommand(
        articleId as ArticleId,
        adaptationId as AdaptationId,
        body.currentContent,
        body.selectedText,
        body.instruction,
      ),
    );

    return { adaptedContent };
  }

  @Post(':articleId/adaptations/:adaptationId/approve')
  async approveAdaptation(
    @Param('articleId') articleId: string,
    @Param('adaptationId') adaptationId: string,
  ): Promise<{ ok: true }> {
    await this.commandBus.execute(
      new ApproveAdaptationCommand(
        articleId as ArticleId,
        adaptationId as AdaptationId,
      ),
    );

    return { ok: true };
  }

  @Post(':articleId/adaptations/:adaptationId/translations')
  async addTranslation(
    @Param('articleId') articleId: string,
    @Param('adaptationId') adaptationId: string,
    @Body() body: { targetLanguage: string },
  ): Promise<{ id: string }> {
    const translationId = await this.commandBus.execute(
      new AddTranslationCommand(
        articleId as ArticleId,
        adaptationId as AdaptationId,
        body.targetLanguage,
      ),
    );

    return { id: translationId };
  }

  @Post(':articleId/adaptations/:adaptationId/translations/:translationId/generate')
  async generateTranslation(
    @Param('articleId') articleId: string,
    @Param('adaptationId') adaptationId: string,
    @Param('translationId') translationId: string,
  ): Promise<{ translatedContent: string }> {
    const translatedContent = await this.commandBus.execute(
      new GenerateTranslationCommand(
        articleId as ArticleId,
        adaptationId as AdaptationId,
        translationId as TranslationId,
      ),
    );

    return { translatedContent };
  }

  @Post(':articleId/adaptations/:adaptationId/translations/:translationId/edit')
  async editTranslation(
    @Param('articleId') articleId: string,
    @Param('adaptationId') adaptationId: string,
    @Param('translationId') translationId: string,
    @Body() body: { translatedContent: string },
  ): Promise<{ ok: true }> {
    await this.commandBus.execute(
      new EditTranslationCommand(
        articleId as ArticleId,
        adaptationId as AdaptationId,
        translationId as TranslationId,
        body.translatedContent,
      ),
    );

    return { ok: true };
  }

  @Post(':articleId/adaptations/:adaptationId/translations/:translationId/approve')
  async approveTranslation(
    @Param('articleId') articleId: string,
    @Param('adaptationId') adaptationId: string,
    @Param('translationId') translationId: string,
  ): Promise<{ ok: true }> {
    await this.commandBus.execute(
      new ApproveTranslationCommand(
        articleId as ArticleId,
        adaptationId as AdaptationId,
        translationId as TranslationId,
      ),
    );

    return { ok: true };
  }

  @Post(':articleId/adaptations/:adaptationId/select-version')
  async selectAdaptationVersion(
    @Param('articleId') articleId: string,
    @Param('adaptationId') adaptationId: string,
    @Body() body: { versionId: string },
  ): Promise<{ ok: true }> {
    await this.commandBus.execute(
      new SelectAdaptationVersionCommand(
        articleId as ArticleId,
        adaptationId as AdaptationId,
        body.versionId as AdaptationVersionId,
      ),
    );

    return { ok: true };
  }
}
