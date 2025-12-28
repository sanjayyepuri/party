create table "user" ("id" text not null primary key, "name" text not null, "email" text not null unique, "emailVerified" boolean not null, "image" text, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz default CURRENT_TIMESTAMP not null, "phone" text);

create table "session" ("id" text not null primary key, "expiresAt" timestamptz not null, "token" text not null unique, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz not null, "ipAddress" text, "userAgent" text, "userId" text not null references "user" ("id") on delete cascade);

create table "account" ("id" text not null primary key, "accountId" text not null, "providerId" text not null, "userId" text not null references "user" ("id") on delete cascade, "accessToken" text, "refreshToken" text, "idToken" text, "accessTokenExpiresAt" timestamptz, "refreshTokenExpiresAt" timestamptz, "scope" text, "password" text, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz not null);

create table "verification" ("id" text not null primary key, "identifier" text not null, "value" text not null, "expiresAt" timestamptz not null, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz default CURRENT_TIMESTAMP not null);

create index "session_userId_idx" on "session" ("userId");

create index "account_userId_idx" on "account" ("userId");

create index "verification_identifier_idx" on "verification" ("identifier");

-- Application Tables

-- Enable UUID generation (available by default in PostgreSQL 13+, or via pgcrypto extension)
create extension if not exists "pgcrypto";

create table "party" (
  "party_id" uuid primary key default gen_random_uuid(),
  "name" text not null,
  "time" timestamptz not null,
  "location" text not null,
  "description" text,
  "slug" text not null unique,
  "created_at" timestamptz default CURRENT_TIMESTAMP not null,
  "updated_at" timestamptz default CURRENT_TIMESTAMP not null,
  "deleted_at" timestamptz
);

create table "guest" (
  "guest_id" uuid primary key default gen_random_uuid(),
  "user_id" text not null references "user" ("id") on delete cascade,
  "name" text not null,
  "email" text not null,
  "phone" text,
  "created_at" timestamptz default CURRENT_TIMESTAMP not null,
  "updated_at" timestamptz default CURRENT_TIMESTAMP not null,
  "deleted_at" timestamptz
);

create table "rsvp" (
  "rsvp_id" uuid primary key default gen_random_uuid(),
  "party_id" uuid not null references "party" ("party_id") on delete cascade,
  "guest_id" uuid not null references "guest" ("guest_id") on delete cascade,
  "status" text not null,
  "created_at" timestamptz default CURRENT_TIMESTAMP not null,
  "updated_at" timestamptz default CURRENT_TIMESTAMP not null,
  "deleted_at" timestamptz,
  unique ("party_id", "guest_id")
);

create index "party_slug_idx" on "party" ("slug");
create index "party_deleted_at_idx" on "party" ("deleted_at");
create index "guest_user_id_idx" on "guest" ("user_id");
create index "guest_email_idx" on "guest" ("email");
create index "guest_deleted_at_idx" on "guest" ("deleted_at");
create index "rsvp_party_id_idx" on "rsvp" ("party_id");
create index "rsvp_guest_id_idx" on "rsvp" ("guest_id");
create index "rsvp_deleted_at_idx" on "rsvp" ("deleted_at");