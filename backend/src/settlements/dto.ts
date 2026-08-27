import { SettlementStatus } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class GenerateSettlementDto {
  @IsString()
  @IsNotEmpty()
  agentId: string;

  @IsDateString()
  from: string;

  @IsDateString()
  to: string;
}

export class QuerySettlementDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  agentId?: string;

  @IsOptional()
  @IsEnum(SettlementStatus)
  status?: SettlementStatus;
}
