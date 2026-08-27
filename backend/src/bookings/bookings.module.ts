import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

@Module({
  controllers: [BookingsController, TicketsController],
  providers: [BookingsService, TicketsService],
})
export class BookingsModule {}
