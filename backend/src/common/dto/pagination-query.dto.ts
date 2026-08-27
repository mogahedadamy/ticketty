import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit?: number;
}

export function paginationArgs(query: PaginationQueryDto): {
  skip: number;
  take: number;
} {
  const page = query.page ?? 1;
  const take = query.limit ?? DEFAULT_PAGE_SIZE;
  return { skip: (page - 1) * take, take };
}
