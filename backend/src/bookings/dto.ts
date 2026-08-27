import { BookingStatus, PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class HoldSeatDto {
  @IsString()
  @IsNotEmpty()
  tripId: string;

  @IsString()
  @IsNotEmpty()
  seatId: string;
}

export class ReleaseSeatDto {
  @IsString()
  @IsNotEmpty()
  seatId: string;
}

export class BookingPassengerDto {
  @IsString()
  @IsNotEmpty()
  seatId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  passengerName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  passengerPhone: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  passengerNationalId?: string;
}

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  tripId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  seatIds: string[];

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => BookingPassengerDto)
  passengers?: BookingPassengerDto[];

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  passengerName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  passengerPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  passengerNationalId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  boardingStop?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  dropOffStop?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  agentId?: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  paymentReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class CancelBookingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}

export class QueryTicketDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  tripId?: string;
}

export class QueryBookingDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  tripId?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}
