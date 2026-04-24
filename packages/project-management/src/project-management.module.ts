import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [CqrsModule],
  providers: [
    // TODO: register command/query handlers from use-cases/
    // TODO: register domain checkers from domain/
    //
    // Repositories are NOT here — they live in @marketing-service/infrastructure
    // and are bound (port → adapter) in InfrastructureModule
  ],
  exports: [],
})
export class ProjectManagementModule {}
