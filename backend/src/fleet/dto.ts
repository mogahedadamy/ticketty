import { BusStatus, SeatType } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

// ─── قوالب المقاعد ───────────────────────────────────────────

export class SeatInputDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  row: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  column: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  label?: string;

  @IsOptional()
  @IsEnum(SeatType)
  seatType?: SeatType;
}

export class CreateSeatTemplateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  rows: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  columnsPerRow: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  aisleAfterColumn: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeatInputDto)
  seats?: SeatInputDto[];
}

export class UpdateSeatTemplateDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  rows?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  columnsPerRow?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  aisleAfterColumn?: number;
}

// ─── الباصات ─────────────────────────────────────────────────

export class CreateBusDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  plateNumber: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  year?: number;

  @IsString()
  @IsNotEmpty()
  seatTemplateId: string;

  @IsOptional()
  @IsEnum(BusStatus)
  status?: BusStatus;
}

export class UpdateBusDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  plateNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  year?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  seatTemplateId?: string;

  @IsOptional()
  @IsEnum(BusStatus)
  status?: BusStatus;
}

export class QueryFleetDto extends PaginationQueryDto {}
