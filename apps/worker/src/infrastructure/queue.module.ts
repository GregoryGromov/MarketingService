// BullMQ connection module (worker side — registers processors)
//
// TODO: implement
//   BullModule.forRootAsync({
//     inject: [ConfigService],
//     useFactory: (config: ConfigService) => ({
//       connection: new Redis(config.getOrThrow('REDIS_URL')),
//     }),
//   })
//
//   Register queues: 'generation', 'publishing'
