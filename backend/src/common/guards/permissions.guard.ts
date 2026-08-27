import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type {
  AuthenticatedRequest,
  AuthUser,
} from '../decorators/current-user.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

function hasPermission(perms: string[], required: string): boolean {
  if (perms.includes('*') || perms.includes(required)) return true;
  const [domain] = required.split('.');
  return perms.includes(`${domain}.*`);
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user: AuthUser | undefined = request.user;
    if (!user) return false;

    const perms = user.permissions ?? [];
    const allowed = required.some((r) => hasPermission(perms, r));
    if (!allowed) {
      throw new ForbiddenException('You do not have permission to do this');
    }
    return true;
  }
}
