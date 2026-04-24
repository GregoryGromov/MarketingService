import { Global, Module } from '@nestjs/common';

// Usage in adapters: @Inject(DRIZZLE) private db: DrizzleDB
//
// TODO: implement useFactory provider
//   import { ConfigService } from '@nestjs/config';
//   import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
//   import postgres from 'postgres';
//   import * as schema from '@marketing-service/database';
//
//   providers: [{
//     provide: DRIZZLE,
//     inject: [ConfigService],
//     useFactory: (config: ConfigService) => {
//       const client = postgres(config.getOrThrow<string>('DATABASE_URL'));
//       return drizzle(client, { schema });
//     },
//   }],
//   exports: [DRIZZLE],

export const DRIZZLE = Symbol('DRIZZLE');
export type DrizzleDB = unknown; // TODO: replace with PostgresJsDatabase<typeof schema>

@Global()
@Module({
  providers: [
    // TODO: DRIZZLE provider (see above)
  ],
  exports: [
    // TODO: DRIZZLE
  ],
})
export class DatabaseModule {}
