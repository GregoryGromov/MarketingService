import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InfrastructureModule } from '@marketing-service/infrastructure';
import { ProjectManagementModule } from '@marketing-service/project-management';
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
        transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
      },
    }),
    InfrastructureModule,
    ProjectManagementModule,
  ],
  providers: [
    CampaignProductionWorker,
  ],
})
export class WorkerModule {}
