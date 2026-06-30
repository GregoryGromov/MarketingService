import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PublicationController } from './publication.controller.js';
import { XIntegrationController } from './x-integration.controller.js';

@Module({
  imports: [CqrsModule],
  controllers: [PublicationController, XIntegrationController],
})
export class PublishingHttpModule {}
