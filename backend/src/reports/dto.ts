import { IsDateString, IsOptional } from 'class-validator';

export class QueryReportDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
