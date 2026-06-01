import { Inject, Injectable } from '@nestjs/common';
import {
  type CompleteSeoBriefExternalCallLogParams,
  type FailSeoBriefExternalCallLogParams,
  SeoBriefExternalCallLog,
  type SeoBriefExternalCallLogId,
  SeoBriefExternalCallLogRepository,
  type StartSeoBriefExternalCallLogParams,
} from '../index.js';

@Injectable()
export class SeoBriefExternalCallLoggerService {
  constructor(
    @Inject(SeoBriefExternalCallLogRepository)
    private readonly repository: SeoBriefExternalCallLogRepository,
  ) {}

  async startCall(params: StartSeoBriefExternalCallLogParams): Promise<SeoBriefExternalCallLog> {
    const log = SeoBriefExternalCallLog.start(params);
    await this.repository.save(log);
    return log;
  }

  async completeCall(
    logId: SeoBriefExternalCallLogId,
    params: CompleteSeoBriefExternalCallLogParams,
  ): Promise<SeoBriefExternalCallLog> {
    const log = await this.repository.findById(logId);
    if (!log) {
      throw new Error(`SEO brief external call log not found: ${logId}`);
    }

    log.complete(params);
    await this.repository.save(log);
    return log;
  }

  async failCall(
    logId: SeoBriefExternalCallLogId,
    params: FailSeoBriefExternalCallLogParams,
  ): Promise<SeoBriefExternalCallLog> {
    const log = await this.repository.findById(logId);
    if (!log) {
      throw new Error(`SEO brief external call log not found: ${logId}`);
    }

    log.fail(params);
    await this.repository.save(log);
    return log;
  }
}
