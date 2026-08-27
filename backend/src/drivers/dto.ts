import { DriverStatus } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateDriverDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phone: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  licenseNumber: string;

  @IsDateString()
  licenseExpiry: string;

  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;

  @IsOptional()
  @IsString()
  branchId?: string;
}

export class UpdateDriverDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  licenseNumber?: string;

  @IsOptional()
  @IsDateString()
  licenseExpiry?: string;

  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;

  @IsOptional()
  @IsString()
  branchId?: string;
}

export class QueryDriverDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;
}
