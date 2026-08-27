ALTER TABLE "users"
  ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lockedUntil" TIMESTAMP(3),
  ADD COLUMN "lastLoginAt" TIMESTAMP(3);

ALTER TABLE "users"
  ADD CONSTRAINT "users_failed_login_attempts_nonnegative"
  CHECK ("failedLoginAttempts" >= 0);
