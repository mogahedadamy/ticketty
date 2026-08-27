import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const findUnique = jest.fn();
  const createAuditLog = jest.fn();
  const signAsync = jest.fn();
  const prisma = {
    user: { findUnique },
    auditLog: { create: createAuditLog },
  } as unknown as PrismaService;
  const jwt = { signAsync } as unknown as JwtService;
  const service = new AuthService(prisma, jwt);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes the email, signs a token, and records the login', async () => {
    const passwordHash = await bcrypt.hash('strong-password', 4);
    findUnique.mockResolvedValue({
      id: 'user-1',
      organizationId: 'org-1',
      branchId: null,
      name: 'مدير النظام',
      email: 'owner@ticketty.sd',
      passwordHash,
      active: true,
      role: { key: 'OWNER', permissions: ['*'] },
      organization: { active: true },
    });
    signAsync.mockResolvedValue('signed-token');
    createAuditLog.mockResolvedValue({ id: 'audit-1' });

    const result = await service.login(
      '  OWNER@TICKETTY.SD ',
      'strong-password',
    );

    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'owner@ticketty.sd' } }),
    );
    expect(signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 'user-1', orgId: 'org-1' }),
    );
    expect(createAuditLog).toHaveBeenCalledWith({
      data: {
        organizationId: 'org-1',
        userId: 'user-1',
        action: 'AUTH_LOGIN_SUCCEEDED',
        entity: 'User',
        entityId: 'user-1',
      },
    });
    expect(result.access_token).toBe('signed-token');
    expect(result.user.permissions).toEqual(['*']);
  });

  it('rejects a wrong password without signing a token', async () => {
    findUnique.mockResolvedValue({
      active: true,
      passwordHash: await bcrypt.hash('correct-password', 4),
      role: { key: 'OWNER', permissions: ['*'] },
      organization: { active: true },
    });

    await expect(
      service.login('owner@ticketty.sd', 'wrong-password'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(signAsync).not.toHaveBeenCalled();
    expect(createAuditLog).not.toHaveBeenCalled();
  });

  it('rejects a user whose organization is inactive', async () => {
    findUnique.mockResolvedValue({
      organizationId: 'org-1',
      active: true,
      passwordHash: await bcrypt.hash('strong-password', 4),
      role: { key: 'OWNER', permissions: ['*'] },
      organization: { active: false },
    });

    await expect(
      service.login('owner@ticketty.sd', 'strong-password'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(signAsync).not.toHaveBeenCalled();
  });

  it('rejects an organization-less tenant user', async () => {
    findUnique.mockResolvedValue({
      organizationId: null,
      active: true,
      passwordHash: await bcrypt.hash('strong-password', 4),
      role: { key: 'OWNER', permissions: ['*'] },
      organization: null,
    });

    await expect(
      service.login('owner@ticketty.sd', 'strong-password'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(signAsync).not.toHaveBeenCalled();
  });
});
