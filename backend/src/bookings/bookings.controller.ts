import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { BookingsService } from './bookings.service';
import {
  CancelBookingDto,
  CreateBookingDto,
  HoldSeatDto,
  QueryBookingDto,
  ReleaseSeatDto,
} from './dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('hold')
  @Permissions('bookings.write', 'bookings.write.own')
  hold(@CurrentUser() user: AuthUser, @Body() dto: HoldSeatDto) {
    return this.bookingsService.hold(user, dto);
  }

  @Post('release')
  @Permissions('bookings.write', 'bookings.write.own')
  release(@CurrentUser() user: AuthUser, @Body() dto: ReleaseSeatDto) {
    return this.bookingsService.release(user, dto.seatId);
  }

  @Post()
  @Permissions('bookings.write', 'bookings.write.own')
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateBookingDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.bookingsService.createBooking(user, dto, idempotencyKey);
  }

  @Get()
  @Permissions('bookings.read', 'bookings.read.own')
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryBookingDto) {
    return this.bookingsService.findAll(user, query);
  }

  @Get(':id')
  @Permissions('bookings.read', 'bookings.read.own')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bookingsService.findOne(user, id);
  }

  @Post(':id/cancel')
  @Permissions('bookings.write', 'bookings.write.own')
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.bookingsService.cancel(user, id, dto.reason, idempotencyKey);
  }
}
