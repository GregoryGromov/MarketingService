import { resolve } from 'node:path';
import { InfrastructureModule } from '@marketing-service/infrastructure';
import { ProjectManagementModule } from '@marketing-service/project-management';
import { SeoBriefingModule } from '@marketing-service/seo-briefing';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { LoggerModule } from 'nestjs-pino';
import { resolvePrettyPinoTransport } from './infrastructure/logging/pretty-pino.transport';
import { CampaignProductionWorker } from './processors/campaign-production.worker';
import { SeoBriefRunWorker } from './processors/seo-brief-run.worker';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../../.env')],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: resolvePrettyPinoTransport(),
      },
    }),
    InfrastructureModule,
    CqrsModule,
    ProjectManagementModule,
    SeoBriefingModule,
  ],
  providers: [CampaignProductionWorker, SeoBriefRunWorker],
})
export class WorkerModule {}
