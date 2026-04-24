// @Global Drizzle provider
//
// Usage in adapters: @Inject(DRIZZLE) private db: DrizzleDB
//
// TODO: implement
//   export const DRIZZLE = Symbol('DRIZZLE');
//   export type DrizzleDB = PostgresJsDatabase<typeof schema>;
//   useFactory: (config) => drizzle(postgres(config.get('DATABASE_URL')), { schema })

export const DRIZZLE = Symbol('DRIZZLE');
export type DrizzleDB = unknown; // TODO: replace with PostgresJsDatabase<typeof schema>

export class DatabaseModule {}
