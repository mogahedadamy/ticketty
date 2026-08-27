import { validateEnvironment } from './env.validation';

const validEnvironment = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://ticketty:ticketty@localhost:5432/ticketty',
  JWT_SECRET: 'a-secure-test-secret-that-is-longer-than-32-characters',
  WEB_ORIGIN: 'http://localhost:3000',
};

describe('validateEnvironment', () => {
  it('normalizes defaults and numeric port', () => {
    expect(validateEnvironment(validEnvironment)).toMatchObject({
      NODE_ENV: 'test',
      PORT: 3001,
      JWT_EXPIRES_IN: '15m',
      JWT_ISSUER: 'ticketty-api',
      JWT_AUDIENCE: 'ticketty-web',
      WEB_ORIGIN: 'http://localhost:3000',
    });
  });

  it('rejects a missing database URL', () => {
    expect(() =>
      validateEnvironment({ ...validEnvironment, DATABASE_URL: undefined }),
    ).toThrow('DATABASE_URL is required');
  });

  it('rejects short and placeholder JWT secrets', () => {
    expect(() =>
      validateEnvironment({ ...validEnvironment, JWT_SECRET: 'too-short' }),
    ).toThrow('JWT_SECRET');
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        JWT_SECRET: 'replace-with-a-long-random-secret-at-least-32-characters',
      }),
    ).toThrow('JWT_SECRET');
  });

  it('rejects invalid origins and ports', () => {
    expect(() =>
      validateEnvironment({ ...validEnvironment, WEB_ORIGIN: 'file:///tmp' }),
    ).toThrow('WEB_ORIGIN');
    expect(() =>
      validateEnvironment({ ...validEnvironment, PORT: '70000' }),
    ).toThrow('PORT');
  });
});
