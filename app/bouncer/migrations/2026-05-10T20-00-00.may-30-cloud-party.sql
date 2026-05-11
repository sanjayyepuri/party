INSERT INTO "party" (
  "party_id",
  "name",
  "time",
  "location",
  "description",
  "slug",
  "created_at",
  "updated_at",
  "deleted_at"
) VALUES (
  '550e8400-e29b-41d4-a716-446655440010',
  'What''s the Move?',
  '2026-05-31T00:00:00Z'::timestamptz,
  'TBD',
  'A practical check-in on whether I should stay in New York or make a different move.',
  'whats-the-move-2026',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  NULL
)
ON CONFLICT ("party_id") DO NOTHING;
