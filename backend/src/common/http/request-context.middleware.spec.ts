import { normalizeRequestId } from './request-context.middleware';

describe('normalizeRequestId', () => {
  it('preserves a bounded safe request ID', () => {
    expect(normalizeRequestId('gateway-123.trace_4')).toBe(
      'gateway-123.trace_4',
    );
  });

  it('replaces unsafe or oversized values', () => {
    expect(normalizeRequestId('contains spaces')).toMatch(/^[0-9a-f-]{36}$/);
    expect(normalizeRequestId('a'.repeat(129))).toMatch(/^[0-9a-f-]{36}$/);
    expect(normalizeRequestId(['duplicate', 'headers'])).toMatch(
      /^[0-9a-f-]{36}$/,
    );
  });
});
