import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Public()
  @Get('liveness')
  liveness() {
    return this.health.liveness();
  }

  @Public()
  @Get('readiness')
  readiness() {
    return this.health.readiness();
  }
}
