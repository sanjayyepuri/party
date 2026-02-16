insert into "party" (
  "party_id",
  "name",
  "time",
  "location",
  "description",
  "slug",
  "created_at",
  "updated_at",
  "deleted_at"
) values (
  '550e8400-e29b-41d4-a716-446655440009',
  'Launch Party',
  '2026-02-28T17:00:00Z'::timestamptz,
  '321 Oak Street, San Jose, CA',
  'We''re launching something new! Join us for a night of demos, drinks, and celebration. Come early for mingling, stay late for the reveal.',
  'launch-party-2026',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  NULL
)
ON CONFLICT ("party_id") DO NOTHING;
