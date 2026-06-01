import { Inject, Injectable } from '@nestjs/common';
import {
  type CreateSeoBriefScoreLogParams,
  SeoBriefScoreLog,
  SeoBriefScoreLogRepository,
} from '../index.js';

@Injectable()
export class SeoBriefScoreLoggerService {
  constructor(
    @Inject(SeoBriefScoreLogRepository)
    private readonly repository: SeoBriefScoreLogRepository,
  ) {}

  async record(params: CreateSeoBriefScoreLogParams): Promise<SeoBriefScoreLog> {
    const log = SeoBriefScoreLog.create(params);
    await this.repository.save(log);
    return log;
  }
}
