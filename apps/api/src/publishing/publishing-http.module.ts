import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PublicationController } from './publication.controller.js';

@Module({
  imports: [CqrsModule],
  controllers: [PublicationController],
})
export class PublishingHttpModule {}
