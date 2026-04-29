import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  CreateArticleCommand,
  type ProjectId,
} from '@marketing-service/editorial';
import { ValibotPipe } from '../infrastructure/common/valibot-validation.pipe';
import {
  CreateArticleSchema,
} from './schemas/create-article.schema';
import type { CreateArticleDto } from './schemas/create-article.schema';

@Controller('articles')
export class ArticleController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async create(
    @Body(new ValibotPipe(CreateArticleSchema)) dto: CreateArticleDto,
  ): Promise<{ id: string }> {
    const id = await this.commandBus.execute(
      new CreateArticleCommand(
        dto.projectId as ProjectId,
        dto.content,
        dto.language,
      ),
    );

    return { id };
  }
}
