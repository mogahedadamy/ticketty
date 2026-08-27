import { TripStatus } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTripDto {
  @IsString()
  @IsNotEmpty()
  routeId: string;

  @IsString()
  @IsNotEmpty()
  busId: string;

  @IsOptional()
  @IsString()
  driverId?: string;

  @IsDateString()
  departureAt: string;

  @IsOptional()
  @IsDateString()
  arrivalAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  driverName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  driverPhone?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus;
}

export class UpdateTripDto {
  @IsOptional()
  @IsString()
  driverId?: string;

  @IsOptional()
  @IsDateString()
  departureAt?: string;

  @IsOptional()
  @IsDateString()
  arrivalAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  driverName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  driverPhone?: string;

  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price?: number;
}

export class CancelTripDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}

export class QueryTripDto extends PaginationQueryDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  routeId?: string;

  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus;
}
