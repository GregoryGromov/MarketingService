interface PinoTransportConfig {
  target: 'pino-pretty';
}

const truthyEnvValues = new Set(['1', 'true', 'yes', 'on']);

function isPrettyLoggingEnabled(): boolean {
  const explicitValue = process.env.LOG_PRETTY ?? process.env.PINO_PRETTY;

  if (explicitValue) {
    return truthyEnvValues.has(explicitValue.toLowerCase());
  }

  return process.env.NODE_ENV !== 'production' && process.stdout.isTTY === true;
}

export function resolvePrettyPinoTransport(): PinoTransportConfig | undefined {
  if (!isPrettyLoggingEnabled()) {
    return undefined;
  }

  try {
    require.resolve('pino-pretty');

    return { target: 'pino-pretty' };
  } catch {
    return undefined;
  }
}
