import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolvePrettyPinoTransport } from '@marketing-service/shared';
import { InfrastructureModule } from '@marketing-service/infrastructure';
import { ProjectManagementModule } from '@marketing-service/project-management';
import { CqrsModule } from '@nestjs/cqrs';
import { resolve } from 'node:path';
import { LoggerModule } from 'nestjs-pino';
import { CampaignProductionWorker } from './processors/campaign-production.worker';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        resolve(process.cwd(), '.env'),
        resolve(process.cwd(), '../../.env'),
      ],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: resolvePrettyPinoTransport(),
      },
    }),
    InfrastructureModule,
    CqrsModule,
    ProjectManagementModule,
  ],
  providers: [
    CampaignProductionWorker,
  ],
})
export class WorkerModule {}
