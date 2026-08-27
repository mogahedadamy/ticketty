import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { GenerateSettlementDto, QuerySettlementDto } from './dto';
import { SettlementsService } from './settlements.service';

@Controller('settlements')
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Post('generate')
  @Permissions('settlements.write')
  generate(@CurrentUser() user: AuthUser, @Body() dto: GenerateSettlementDto) {
    return this.settlementsService.generate(user, dto);
  }

  @Get()
  @Permissions('settlements.read', 'settlements.read.own')
  findAll(@CurrentUser() user: AuthUser, @Query() query: QuerySettlementDto) {
    return this.settlementsService.findAll(user, query);
  }

  @Get(':id')
  @Permissions('settlements.read', 'settlements.read.own')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.settlementsService.findOne(user, id);
  }

  @Post(':id/settle')
  @Permissions('settlements.write')
  settle(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.settlementsService.settle(user, id);
  }
}
