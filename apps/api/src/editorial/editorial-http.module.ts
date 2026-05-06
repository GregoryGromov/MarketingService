import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ArticleController } from './article.controller';
import { TestUiController } from './test-ui.controller';

// HTTP module for Editorial bounded context
//
// Groups controllers + request schemas for this BC.

@Module({
  imports: [CqrsModule],
  controllers: [ArticleController, TestUiController],
})
export class EditorialHttpModule {}
