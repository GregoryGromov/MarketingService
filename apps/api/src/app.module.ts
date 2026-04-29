import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EditorialModule } from '@marketing-service/editorial';
import { InfrastructureModule } from '@marketing-service/infrastructure';
import { LoggerModule } from 'nestjs-pino';
import { EditorialHttpModule } from './editorial/editorial-http.module';

// TODO: uncomment as modules are implemented
// import { ProjectManagementModule } from '@marketing-service/project-management';
// import { PublishingModule } from '@marketing-service/publishing';
// import { QueueModule } from './infrastructure/queue.module';
// import { HealthModule } from './infrastructure/health.module';

// TODO: uncomment as BC HTTP modules are implemented
// import { ProjectManagementHttpModule } from './project-management/project-management-http.module';
// import { PublishingHttpModule } from './publishing/publishing-http.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
      },
    }),
    InfrastructureModule,   // DB + all port→adapter bindings
    // QueueModule,            // BullMQ + Redis
    // HealthModule,           // /health endpoint
    // ProjectManagementModule,
    EditorialModule,
    // PublishingModule,
    // ProjectManagementHttpModule,
    EditorialHttpModule,
    // PublishingHttpModule,
  ],
})
export class AppModule {}
