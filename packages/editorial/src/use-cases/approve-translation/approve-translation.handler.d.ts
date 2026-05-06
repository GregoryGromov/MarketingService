import { EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { TranslationRepository } from '../../domain/translation.repository.js';
import { ApproveTranslationCommand } from './approve-translation.command.js';
export declare class ApproveTranslationHandler implements ICommandHandler<ApproveTranslationCommand, void> {
    private readonly translationRepository;
    private readonly eventBus;
    constructor(translationRepository: TranslationRepository, eventBus: EventBus);
    execute(command: ApproveTranslationCommand): Promise<void>;
}
//# sourceMappingURL=approve-translation.handler.d.ts.map