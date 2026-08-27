import { SettlementStatus } from '@prisma/client';
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

export class QuerySettlementDto {
  @IsOptional()
  @IsString()
  agentId?: string;

  @IsOptional()
  @IsEnum(SettlementStatus)
  status?: SettlementStatus;
}
