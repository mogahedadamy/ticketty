import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class RouteStopDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  order: number;
}

export class CreateRouteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fromCity: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  toCity: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  distanceKm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RouteStopDto)
  stops?: RouteStopDto[];
}

export class UpdateRouteDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fromCity?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  toCity?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  distanceKm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RouteStopDto)
  stops?: RouteStopDto[];
}

export class QueryRouteDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
