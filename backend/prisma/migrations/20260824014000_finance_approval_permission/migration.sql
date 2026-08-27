UPDATE "roles"
SET "permissions" = array_append("permissions", 'expenses.approve')
WHERE "key" = 'FINANCE'
  AND NOT ('expenses.approve' = ANY("permissions"));
