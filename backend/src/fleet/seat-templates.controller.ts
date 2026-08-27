import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { requireOrgId } from '../common/org';
import { CreateSeatTemplateDto, UpdateSeatTemplateDto } from './dto';
import { SeatTemplatesService } from './seat-templates.service';

@Controller('seat-templates')
export class SeatTemplatesController {
  constructor(private readonly service: SeatTemplatesService) {}

  @Post()
  @Permissions('fleet.write')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSeatTemplateDto) {
    return this.service.create(requireOrgId(user), dto);
  }

  @Get()
  @Permissions('fleet.read')
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(requireOrgId(user));
  }

  @Get(':id')
  @Permissions('fleet.read')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findOne(requireOrgId(user), id);
  }

  @Patch(':id')
  @Permissions('fleet.write')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateSeatTemplateDto,
  ) {
    return this.service.update(requireOrgId(user), id, dto);
  }

  @Delete(':id')
  @Permissions('fleet.write')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(requireOrgId(user), id);
  }
}
