import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import {
  CreateExpenseAdjustmentDto,
  CreateExpenseDto,
  QueryExpenseDto,
  UpdateExpenseDto,
} from './dto';
import { ExpensesService } from './expenses.service';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @Permissions('expenses.write')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(user, dto);
  }

  @Get()
  @Permissions('expenses.read')
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryExpenseDto) {
    return this.expensesService.findAll(user, query);
  }

  @Get(':id')
  @Permissions('expenses.read')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.expensesService.findOne(user, id);
  }

  @Patch(':id')
  @Permissions('expenses.write')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(user, id, dto);
  }

  @Post(':id/approve')
  @Permissions('expenses.approve')
  approve(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.expensesService.approve(user, id);
  }

  @Post(':id/adjustments')
  @Permissions('expenses.approve')
  adjust(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateExpenseAdjustmentDto,
  ) {
    return this.expensesService.adjust(user, id, dto);
  }

  @Delete(':id')
  @Permissions('expenses.write')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.expensesService.remove(user, id);
  }
}
