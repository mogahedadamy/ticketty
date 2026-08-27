import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthUser } from '../decorators/current-user.decorator';
import { PermissionsGuard } from './permissions.guard';

function contextFor(user?: AuthUser): ExecutionContext {
  return {
    getHandler: () => contextFor,
    getClass: () => PermissionsGuard,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

const baseUser: AuthUser = {
  sub: 'user-1',
  orgId: 'org-1',
  branchId: null,
  name: 'User',
  email: 'user@example.invalid',
  roleKey: 'TEST',
  permissions: [],
};

describe('PermissionsGuard', () => {
  it.each([
    [['*'], 'bookings.write'],
    [['bookings.*'], 'bookings.write'],
    [['bookings.write'], 'bookings.write'],
  ])('accepts %j for %s', (permissions, required) => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([required]),
    } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);

    expect(guard.canActivate(contextFor({ ...baseUser, permissions }))).toBe(
      true,
    );
  });

  it('rejects a permission from another domain', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['bookings.write']),
    } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);

    expect(() =>
      guard.canActivate(
        contextFor({ ...baseUser, permissions: ['payments.write'] }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('rejects a missing authenticated user when permission is required', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['bookings.read']),
    } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);

    expect(guard.canActivate(contextFor())).toBe(false);
  });

  it('allows authenticated routes without permission metadata', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);

    expect(guard.canActivate(contextFor(baseUser))).toBe(true);
  });
});
