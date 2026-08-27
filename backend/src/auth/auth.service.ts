import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        role: true,
        organization: { select: { active: true } },
      },
    });

    if (
      !user ||
      !user.active ||
      !user.organizationId ||
      !user.organization?.active
    ) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    const payload = {
      sub: user.id,
      orgId: user.organizationId,
      branchId: user.branchId,
      name: user.name,
      email: user.email,
      roleKey: user.role.key,
      permissions: user.role.permissions,
    };

    const access_token = await this.jwt.signAsync(payload);

    await this.prisma.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: 'AUTH_LOGIN_SUCCEEDED',
        entity: 'User',
        entityId: user.id,
      },
    });

    return {
      access_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roleKey: user.role.key,
        orgId: user.organizationId,
        branchId: user.branchId,
        permissions: user.role.permissions,
      },
    };
  }
}
