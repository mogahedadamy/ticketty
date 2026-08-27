import { canGrantPermissions } from './administration.service';

describe('administration permission grant ceiling', () => {
  it('allows an owner wildcard to grant any permission', () => {
    expect(
      canGrantPermissions(['*'], ['settings.write', 'payments.read']),
    ).toBe(true);
  });

  it('allows exact, domain wildcard, and narrower own permissions', () => {
    expect(
      canGrantPermissions(
        ['bookings.write', 'payments.*'],
        ['bookings.write.own', 'payments.read'],
      ),
    ).toBe(true);
  });

  it('rejects global wildcard and permissions outside the actor ceiling', () => {
    expect(canGrantPermissions(['settings.write'], ['*'])).toBe(false);
    expect(canGrantPermissions(['settings.write'], ['payments.write'])).toBe(
      false,
    );
  });
});
