import { Module } from '@nestjs/common';
import { BusesController } from './buses.controller';
import { BusesService } from './buses.service';
import { SeatTemplatesController } from './seat-templates.controller';
import { SeatTemplatesService } from './seat-templates.service';

@Module({
  controllers: [SeatTemplatesController, BusesController],
  providers: [SeatTemplatesService, BusesService],
})
export class FleetModule {}
