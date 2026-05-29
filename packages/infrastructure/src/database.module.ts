import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as schema from '@marketing-service/database';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

// Usage in adapters: @Inject(DRIZZLE) private db: DrizzleDB

export const DRIZZLE = Symbol('DRIZZLE');
export type DrizzleDB = PostgresJsDatabase<typeof schema>;
export type DrizzleTx = Parameters<Parameters<DrizzleDB['transaction']>[0]>[0];
export type DrizzleExecutor = DrizzleDB | DrizzleTx;

const DRIZZLE_MIGRATIONS_LOCK_ID = 821_519_421;

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: async (config: ConfigService): Promise<DrizzleDB> => {
        const client = postgres(config.getOrThrow<string>('DATABASE_URL'));
        const db = drizzle(client, { schema });
        const migrationsFolder = config.get<string>('MIGRATIONS_FOLDER');

        if (migrationsFolder) {
          await client`select pg_advisory_lock(${DRIZZLE_MIGRATIONS_LOCK_ID})`;
          try {
            await migrate(db, { migrationsFolder });
          } finally {
            await client`select pg_advisory_unlock(${DRIZZLE_MIGRATIONS_LOCK_ID})`;
          }
        }

        return db;
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
