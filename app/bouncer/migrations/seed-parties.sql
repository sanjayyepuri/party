-- Seed data for parties table
-- This script inserts sample party data for testing and development

-- Insert sample parties
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
) VALUES
(
  '550e8400-e29b-41d4-a716-446655440001',
  'New Year''s Eve Celebration',
  '2024-12-31T20:00:00Z'::timestamptz,
  '123 Main Street, San Francisco, CA',
  'Ring in the new year with friends! Join us for an evening of celebration, music, and good vibes. Dress code: festive attire.',
  'new-years-eve-2024',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  NULL
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  'Summer BBQ Party',
  '2024-07-15T18:00:00Z'::timestamptz,
  '456 Park Avenue, Oakland, CA',
  'Come join us for a classic summer BBQ! We''ll have burgers, hot dogs, and all the fixings. Bring your appetite and a side dish to share.',
  'summer-bbq-2024',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  NULL
),
(
  '550e8400-e29b-41d4-a716-446655440003',
  'Garden Party Brunch',
  '2024-05-20T11:00:00Z'::timestamptz,
  '789 Garden Lane, Berkeley, CA',
  'A delightful brunch in the garden. Fresh pastries, mimosas, and great company. Perfect for a sunny spring morning.',
  'garden-brunch-2024',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  NULL
),
(
  '550e8400-e29b-41d4-a716-446655440004',
  'Housewarming Party',
  '2024-03-10T17:00:00Z'::timestamptz,
  '321 Oak Street, San Jose, CA',
  'Help us celebrate our new home! Come see the place, enjoy some snacks, and bring good energy. No gifts necessary, just your presence!',
  'housewarming-2024',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  NULL
),
(
  '550e8400-e29b-41d4-a716-446655440005',
  'Birthday Bash',
  '2024-08-25T19:00:00Z'::timestamptz,
  '654 Celebration Drive, Palo Alto, CA',
  'Another year older, another year wiser! Join us for a birthday celebration with cake, music, and dancing. All ages welcome!',
  'birthday-bash-2024',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  NULL
),
(
  '550e8400-e29b-41d4-a716-446655440006',
  'Game Night',
  '2024-06-08T19:30:00Z'::timestamptz,
  '987 Boardwalk Boulevard, Mountain View, CA',
  'Board games, card games, and video games! Bring your favorite game or just come to play. Snacks and drinks provided.',
  'game-night-2024',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  NULL
),
(
  '550e8400-e29b-41d4-a716-446655440007',
  'Wine Tasting Evening',
  '2024-09-14T18:00:00Z'::timestamptz,
  '147 Vineyard Way, Napa, CA',
  'An evening of wine tasting and good conversation. We''ll sample wines from local vineyards and pair them with cheese and charcuterie.',
  'wine-tasting-2024',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  NULL
),
(
  '550e8400-e29b-41d4-a716-446655440008',
  'Holiday Cookie Exchange',
  '2024-12-15T14:00:00Z'::timestamptz,
  '258 Cookie Court, Santa Clara, CA',
  'Bring your favorite cookies to share! We''ll exchange recipes and enjoy a cozy afternoon of baking and conversation. Hot cocoa provided.',
  'cookie-exchange-2024',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  NULL
)
ON CONFLICT ("party_id") DO NOTHING;

