import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

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

    const now = new Date();
    if (user.lockedUntil && user.lockedUntil > now) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await this.recordFailedAttempt(user.id);
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: now,
      },
    });

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

  private async recordFailedAttempt(userId: string): Promise<void> {
    const failed = await this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: { increment: 1 } },
      select: { failedLoginAttempts: true },
    });
    if (failed.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS) },
      });
    }
  }
}
