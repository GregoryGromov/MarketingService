import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as schema from '@marketing-service/database';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Usage in adapters: @Inject(DRIZZLE) private db: DrizzleDB

export const DRIZZLE = Symbol('DRIZZLE');
export type DrizzleDB = PostgresJsDatabase<typeof schema>;
export type DrizzleTx = Parameters<Parameters<DrizzleDB['transaction']>[0]>[0];
export type DrizzleExecutor = DrizzleDB | DrizzleTx;

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: (config: ConfigService): DrizzleDB => {
        const client = postgres(config.getOrThrow<string>('DATABASE_URL'));
        return drizzle(client, { schema });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
