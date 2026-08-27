import { Injectable, NotFoundException } from '@nestjs/common';
import { SeatType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSeatTemplateDto, UpdateSeatTemplateDto } from './dto';

function columnLetter(column: number): string {
  return String.fromCharCode(64 + column);
}

function generateSeats(rows: number, columnsPerRow: number) {
  const seats: Array<{
    row: number;
    column: number;
    label: string;
    seatType: SeatType;
  }> = [];
  for (let row = 1; row <= rows; row += 1) {
    for (let column = 1; column <= columnsPerRow; column += 1) {
      seats.push({
        row,
        column,
        label: `${columnLetter(column)}${row}`,
        seatType: SeatType.REGULAR,
      });
    }
  }
  return seats;
}

@Injectable()
export class SeatTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  create(orgId: string, dto: CreateSeatTemplateDto) {
    const { rows, columnsPerRow, seats, ...data } = dto;
    const seatRows = seats?.length
      ? seats.map((s) => ({
          row: s.row,
          column: s.column,
          label: s.label ?? `${columnLetter(s.column)}${s.row}`,
          seatType: s.seatType ?? SeatType.REGULAR,
        }))
      : generateSeats(rows, columnsPerRow);

    return this.prisma.seatTemplate.create({
      data: {
        ...data,
        rows,
        columnsPerRow,
        organizationId: orgId,
        seats: { create: seatRows },
      },
      include: { seats: { orderBy: [{ row: 'asc' }, { column: 'asc' }] } },
    });
  }

  findAll(orgId: string) {
    return this.prisma.seatTemplate.findMany({
      where: { organizationId: orgId },
      include: {
        seats: { orderBy: [{ row: 'asc' }, { column: 'asc' }] },
        _count: { select: { buses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(orgId: string, id: string) {
    const template = await this.prisma.seatTemplate.findFirst({
      where: { id, organizationId: orgId },
      include: {
        seats: { orderBy: [{ row: 'asc' }, { column: 'asc' }] },
        buses: true,
      },
    });
    if (!template) throw new NotFoundException('قالب المقاعد غير موجود');
    return template;
  }

  async update(orgId: string, id: string, dto: UpdateSeatTemplateDto) {
    await this.ensureExists(orgId, id);
    return this.prisma.seatTemplate.update({
      where: { id },
      data: dto,
      include: { seats: { orderBy: [{ row: 'asc' }, { column: 'asc' }] } },
    });
  }

  async remove(orgId: string, id: string) {
    await this.ensureExists(orgId, id);
    return this.prisma.seatTemplate.delete({ where: { id } });
  }

  private async ensureExists(orgId: string, id: string) {
    const template = await this.prisma.seatTemplate.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!template) throw new NotFoundException('قالب المقاعد غير موجود');
    return template;
  }
}
