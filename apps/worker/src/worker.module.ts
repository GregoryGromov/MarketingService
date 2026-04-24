import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

// TODO: uncomment as modules are implemented
// import { InfrastructureModule } from '@marketing-service/infrastructure';
// import { EditorialModule } from '@marketing-service/editorial';
// import { PublishingModule } from '@marketing-service/publishing';
// import { QueueModule } from './infrastructure/queue.module';

// TODO: import processors
// import { GenerateAdaptationProcessor } from './processors/generation/generate-adaptation.processor';
// import { GenerateTranslationProcessor } from './processors/generation/generate-translation.processor';
// import { ExecutePublicationProcessor } from './processors/publishing/execute-publication.processor';
// import { UpdatePublishedProcessor } from './processors/publishing/update-published.processor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
      },
    }),
    // InfrastructureModule,  // DB + all port→adapter bindings
    // QueueModule,           // BullMQ + Redis
    // EditorialModule,
    // PublishingModule,
  ],
  providers: [
    // GenerateAdaptationProcessor,
    // GenerateTranslationProcessor,
    // ExecutePublicationProcessor,
    // UpdatePublishedProcessor,
  ],
})
export class WorkerModule {}
