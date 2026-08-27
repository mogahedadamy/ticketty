const NODE_ENV_VALUES = new Set(['development', 'test', 'production']);
const PLACEHOLDER_SECRETS = new Set([
  'replace-with-a-long-random-secret-at-least-32-characters',
  'change-me',
  'secret',
]);

export type ValidatedEnvironment = Record<string, unknown> & {
  NODE_ENV: 'development' | 'test' | 'production';
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_ISSUER: string;
  JWT_AUDIENCE: string;
  PORT: number;
  TRUST_PROXY_HOPS: number;
  WEB_ORIGIN: string;
};

function requiredString(
  environment: Record<string, unknown>,
  key: string,
  fallback?: string,
): string {
  const value = environment[key] ?? fallback;
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${key} is required`);
  }
  return value.trim();
}

function httpUrl(value: string, key: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${key} must be a valid URL`);
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`${key} must use http or https`);
  }
  return url.origin;
}

export function validateEnvironment(
  environment: Record<string, unknown>,
): ValidatedEnvironment {
  const nodeEnv = requiredString(environment, 'NODE_ENV', 'development');
  if (!NODE_ENV_VALUES.has(nodeEnv)) {
    throw new Error('NODE_ENV must be development, test, or production');
  }

  const databaseUrl = requiredString(environment, 'DATABASE_URL');
  let database: URL;
  try {
    database = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL URL');
  }
  if (!['postgresql:', 'postgres:'].includes(database.protocol)) {
    throw new Error('DATABASE_URL must use the postgresql protocol');
  }

  const jwtSecret = requiredString(environment, 'JWT_SECRET');
  if (
    jwtSecret.length < 32 ||
    PLACEHOLDER_SECRETS.has(jwtSecret) ||
    jwtSecret.startsWith('replace-with-')
  ) {
    throw new Error(
      'JWT_SECRET must be a non-placeholder value of at least 32 characters',
    );
  }

  const portValue = requiredString(environment, 'PORT', '3001');
  const port = Number(portValue);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  const trustProxyValue = requiredString(environment, 'TRUST_PROXY_HOPS', '0');
  const trustProxyHops = Number(trustProxyValue);
  if (!Number.isInteger(trustProxyHops) || trustProxyHops < 0) {
    throw new Error('TRUST_PROXY_HOPS must be a nonnegative integer');
  }

  return {
    ...environment,
    NODE_ENV: nodeEnv as ValidatedEnvironment['NODE_ENV'],
    DATABASE_URL: databaseUrl,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: requiredString(environment, 'JWT_EXPIRES_IN', '15m'),
    JWT_ISSUER: requiredString(environment, 'JWT_ISSUER', 'ticketty-api'),
    JWT_AUDIENCE: requiredString(environment, 'JWT_AUDIENCE', 'ticketty-web'),
    PORT: port,
    TRUST_PROXY_HOPS: trustProxyHops,
    WEB_ORIGIN: httpUrl(
      requiredString(environment, 'WEB_ORIGIN', 'http://localhost:3000'),
      'WEB_ORIGIN',
    ),
  };
}
