import { BadRequestException } from '@nestjs/common';
import { reportRange } from './reports.service';

describe('reportRange', () => {
  it('builds an inclusive UTC date-only range', () => {
    expect(reportRange({ from: '2026-01-01', to: '2026-01-31' })).toEqual({
      gte: new Date('2026-01-01T00:00:00.000Z'),
      lte: new Date('2026-01-31T23:59:59.999Z'),
    });
  });

  it('defaults a missing from date to the start of the selected to date', () => {
    expect(reportRange({ to: '2026-03-08' })).toEqual({
      gte: new Date('2026-03-08T00:00:00.000Z'),
      lte: new Date('2026-03-08T23:59:59.999Z'),
    });
  });

  it('rejects reversed and oversized ranges', () => {
    expect(() => reportRange({ from: '2026-02-01', to: '2026-01-01' })).toThrow(
      BadRequestException,
    );
    expect(() => reportRange({ from: '2024-01-01', to: '2026-01-01' })).toThrow(
      'cannot exceed 366 days',
    );
  });
});
