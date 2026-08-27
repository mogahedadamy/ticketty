import { ForbiddenException } from '@nestjs/common';
import { requireOrgId, tenantScope } from './org';
import type { AuthUser } from './decorators/current-user.decorator';

const user = (overrides: Partial<AuthUser> = {}): AuthUser => ({
  sub: 'user-1',
  orgId: 'org-1',
  branchId: null,
  name: 'Test',
  email: 'test@example.com',
  roleKey: 'OWNER',
  permissions: ['*'],
  ...overrides,
});

describe('tenant scope', () => {
  it('always restricts organization data', () => {
    expect(tenantScope(user())).toEqual({ organizationId: 'org-1' });
  });

  it('adds strict branch scope for branch users', () => {
    expect(tenantScope(user({ branchId: 'branch-1' }))).toEqual({
      organizationId: 'org-1',
      branchId: 'branch-1',
    });
  });

  it('rejects users without an organization', () => {
    expect(() => requireOrgId(user({ orgId: null }))).toThrow(
      ForbiddenException,
    );
  });
});
