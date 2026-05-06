import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ProjectController } from './project.controller.js';

@Module({
  imports: [CqrsModule],
  controllers: [ProjectController],
})
export class ProjectManagementHttpModule {}
