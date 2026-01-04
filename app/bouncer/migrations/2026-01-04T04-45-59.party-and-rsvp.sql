-- Create party table
create table "party" (
  "party_id" text not null primary key,
  "name" text not null,
  "time" timestamptz not null,
  "location" text not null,
  "description" text not null,
  "slug" text not null unique,
  "created_at" timestamptz default CURRENT_TIMESTAMP not null,
  "updated_at" timestamptz default CURRENT_TIMESTAMP not null,
  "deleted_at" timestamptz
);

-- Create rsvp table
create table "rsvp" (
  "rsvp_id" text not null primary key,
  "party_id" text not null references "party" ("party_id") on delete cascade,
  "user_id" text not null references "user" ("id") on delete cascade,
  "status" text not null,
  "created_at" timestamptz default CURRENT_TIMESTAMP not null,
  "updated_at" timestamptz default CURRENT_TIMESTAMP not null,
  "deleted_at" timestamptz,
  unique ("party_id", "user_id")
);

-- Create indexes for performance
create index "party_slug_idx" on "party" ("slug");
create index "party_deleted_at_idx" on "party" ("deleted_at");
create index "party_time_idx" on "party" ("time");

create index "rsvp_party_id_idx" on "rsvp" ("party_id");
create index "rsvp_user_id_idx" on "rsvp" ("user_id");
create index "rsvp_deleted_at_idx" on "rsvp" ("deleted_at");
create index "rsvp_party_user_idx" on "rsvp" ("party_id", "user_id");

