import { EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { TranslationRepository } from '../../domain/translation.repository.js';
import { EditTranslationCommand } from './edit-translation.command.js';
export declare class EditTranslationHandler implements ICommandHandler<EditTranslationCommand, void> {
    private readonly translationRepository;
    private readonly eventBus;
    constructor(translationRepository: TranslationRepository, eventBus: EventBus);
    execute(command: EditTranslationCommand): Promise<void>;
}
//# sourceMappingURL=edit-translation.handler.d.ts.map