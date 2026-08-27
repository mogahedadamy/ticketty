import { IsOptional, Matches } from 'class-validator';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class QueryReportDto {
  @IsOptional()
  @Matches(DATE_ONLY_PATTERN)
  from?: string;

  @IsOptional()
  @Matches(DATE_ONLY_PATTERN)
  to?: string;
}
