create table "passkey" (
  "id" text not null primary key,
  "name" text not null,
  "publicKey" text not null,
  "userId" text not null references "user" ("id") on delete cascade,
  "credentialID" text not null unique,
  "counter" integer not null default 0,
  "deviceType" text,
  "backedUp" boolean not null default false,
  "transports" text,
  "createdAt" timestamptz default CURRENT_TIMESTAMP not null,
  "aaguid" text
);

create index "passkey_userId_idx" on "passkey" ("userId");
create index "passkey_credentialID_idx" on "passkey" ("credentialID");

