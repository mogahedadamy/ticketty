import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  MAX_PAGE_SIZE,
  PaginationQueryDto,
  paginationArgs,
} from './pagination-query.dto';

describe('PaginationQueryDto', () => {
  it('uses bounded defaults', () => {
    expect(paginationArgs({})).toEqual({ skip: 0, take: 50 });
  });

  it('calculates an offset for a requested page', () => {
    expect(paginationArgs({ page: 3, limit: 25 })).toEqual({
      skip: 50,
      take: 25,
    });
  });

  it('transforms query strings and rejects limits above the maximum', async () => {
    const valid = plainToInstance(PaginationQueryDto, {
      page: '2',
      limit: '100',
    });
    expect(await validate(valid)).toHaveLength(0);
    expect(valid).toMatchObject({ page: 2, limit: 100 });

    const oversized = plainToInstance(PaginationQueryDto, {
      limit: String(MAX_PAGE_SIZE + 1),
    });
    expect(await validate(oversized)).not.toHaveLength(0);
  });
});
