import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SeoBriefController } from './seo-brief.controller.js';
import { SeoBriefTestUiController } from './seo-brief-test-ui.controller.js';

@Module({
  imports: [CqrsModule],
  controllers: [SeoBriefController, SeoBriefTestUiController],
})
export class SeoBriefingHttpModule {}
