export interface AppLog {
  timestamp: string;
  featureId: string;
  subModule: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
  payload?: Record<string, unknown>;
}

type Payload = Record<string, unknown>;

const emit = (log: AppLog): void => {
  const s = JSON.stringify(log);
  ({ DEBUG: console.debug, INFO: console.info, WARN: console.warn, ERROR: console.error })[log.level](s);
};

export const createLogger = (featureId: string, subModule: string) => ({
  // payload attached conditionally so the property is omitted (not set to undefined) under exactOptionalPropertyTypes
  debug: (message: string, payload?: Payload) =>
    emit({ timestamp: new Date().toISOString(), featureId, subModule, level: 'DEBUG', message, ...(payload !== undefined && { payload }) }),
  info: (message: string, payload?: Payload) =>
    emit({ timestamp: new Date().toISOString(), featureId, subModule, level: 'INFO', message, ...(payload !== undefined && { payload }) }),
  warn: (message: string, payload?: Payload) =>
    emit({ timestamp: new Date().toISOString(), featureId, subModule, level: 'WARN', message, ...(payload !== undefined && { payload }) }),
  error: (message: string, payload?: Payload) =>
    emit({ timestamp: new Date().toISOString(), featureId, subModule, level: 'ERROR', message, ...(payload !== undefined && { payload }) }),
});

export type Logger = ReturnType<typeof createLogger>;
