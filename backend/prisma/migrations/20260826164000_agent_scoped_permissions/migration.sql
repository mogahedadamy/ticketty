UPDATE "roles"
SET "permissions" = ARRAY[
  'trips.read',
  'bookings.read.own',
  'bookings.write.own',
  'tickets.read.own',
  'tickets.write.own',
  'customers.read',
  'customers.write',
  'payments.read.own',
  'agents.read.own',
  'settlements.read.own'
]::TEXT[]
WHERE "key" = 'AGENT';
