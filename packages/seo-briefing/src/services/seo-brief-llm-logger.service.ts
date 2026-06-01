import { Inject, Injectable } from '@nestjs/common';
import {
  type CompleteSeoBriefLlmCallLogParams,
  type FailSeoBriefLlmCallLogParams,
  SeoBriefLlmCallLog,
  type SeoBriefLlmCallLogId,
  SeoBriefLlmLogRepository,
  type StartSeoBriefLlmCallLogParams,
} from '../index.js';

@Injectable()
export class SeoBriefLlmLoggerService {
  constructor(
    @Inject(SeoBriefLlmLogRepository)
    private readonly repository: SeoBriefLlmLogRepository,
  ) {}

  async startCall(params: StartSeoBriefLlmCallLogParams): Promise<SeoBriefLlmCallLog> {
    const log = SeoBriefLlmCallLog.start(params);
    await this.repository.save(log);
    return log;
  }

  async completeCall(
    logId: SeoBriefLlmCallLogId,
    params: CompleteSeoBriefLlmCallLogParams,
  ): Promise<SeoBriefLlmCallLog> {
    const log = await this.repository.findById(logId);
    if (!log) {
      throw new Error(`SEO brief LLM call log not found: ${logId}`);
    }

    log.complete(params);
    await this.repository.save(log);
    return log;
  }

  async failCall(
    logId: SeoBriefLlmCallLogId,
    params: FailSeoBriefLlmCallLogParams,
  ): Promise<SeoBriefLlmCallLog> {
    const log = await this.repository.findById(logId);
    if (!log) {
      throw new Error(`SEO brief LLM call log not found: ${logId}`);
    }

    log.fail(params);
    await this.repository.save(log);
    return log;
  }
}
