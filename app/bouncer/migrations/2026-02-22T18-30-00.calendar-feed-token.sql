create table "calendar_feed_token" (
  "user_id" text not null primary key references "user" ("id") on delete cascade,
  "token" text not null unique,
  "created_at" timestamptz default CURRENT_TIMESTAMP not null,
  "updated_at" timestamptz default CURRENT_TIMESTAMP not null
);
