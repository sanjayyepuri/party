/**
 * Sync only editable event details; never changes the slug, party ID, or RSVPs.
 * Requires Node 22.18+ (the project's current Node supports native .ts loading).
 * From the repository root, after editing invitation-copy.ts:
 *   vercel env run -e development -- node scripts/sync-fall-invitation.cjs
 * Inspect differences without writing:
 *   vercel env run -e development -- node scripts/sync-fall-invitation.cjs --check
 * Database credentials stay in the child process environment, not a local file.
 */
const { Client } = require("../app/bouncer/node_modules/pg");
const {
  invitationCopy: copy,
} = require("../app/bouncer/app/parties/time-to-fall-2026/invitation-copy.ts");
const slug = "time-to-fall-2026";
const event = {
  name: Object.values(copy.title).filter(Boolean).join(" "),
  time: new Date(copy.event.time).toISOString(),
  location: copy.event.location || copy.messages.locationPending,
  description: copy.event.description,
};
if (!process.env.NEON_POSTGRES_URL) {
  console.error(
    "Missing NEON_POSTGRES_URL. Run through vercel env run as shown in this script's header.",
  );
  process.exit(1);
}
if (!event.name.trim()) throw new Error("The invitation needs a title.");
new Intl.DateTimeFormat("en-US", { timeZone: copy.event.timeZone }).format(
  new Date(event.time),
);

(async () => {
  const client = new Client({
    connectionString: process.env.NEON_POSTGRES_URL,
  });
  try {
    await client.connect();
    const existing = await client.query(
      "SELECT name, time, location, description FROM party WHERE slug = $1 AND deleted_at IS NULL",
      [slug],
    );
    if (existing.rowCount !== 1)
      throw new Error(
        "Expected one active party; apply its creation migration first.",
      );
    const current = {
      ...existing.rows[0],
      time: existing.rows[0].time.toISOString(),
    };
    if (process.argv.includes("--check")) {
      console.log(JSON.stringify({ current, contentFile: event }, null, 2));
      return;
    }
    const result = await client.query(
      `UPDATE party SET name = $1, time = $2, location = $3, description = $4, updated_at = CURRENT_TIMESTAMP
       WHERE slug = $5 AND deleted_at IS NULL
       AND (name, time, location, description) IS DISTINCT FROM ($1, $2::timestamptz, $3, $4)`,
      [event.name, event.time, event.location, event.description, slug],
    );
    console.log(
      result.rowCount
        ? "Invitation details synced. Party identity and RSVPs preserved."
        : "Invitation details already match. No changes needed.",
    );
  } finally {
    await client.end();
  }
})().catch(() => {
  console.error(
    "Unable to sync invitation. Verify the development database connection and active party record.",
  );
  process.exitCode = 1;
});
