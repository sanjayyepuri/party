INSERT INTO "party" (
  "party_id", "name", "time", "location", "description", "slug",
  "created_at", "updated_at", "deleted_at"
) VALUES (
  '550e8400-e29b-41d4-a716-446655440011',
  'Time to Fall',
  '2026-11-14T00:30:00Z'::timestamptz,
  'To be announced',
  'A little warmth as the weather turns. Come spend an autumn evening in good company. No occasion needed, just you.',
  'time-to-fall-2026',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL
)
ON CONFLICT ("party_id") DO NOTHING;
