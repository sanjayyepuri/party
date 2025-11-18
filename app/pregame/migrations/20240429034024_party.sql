CREATE TABLE IF NOT EXISTS guests
(
    id              SERIAL  PRIMARY KEY NOT NULL,
    first_name      TEXT    NOT NULL,
    last_name       TEXT    NOT NULL,
    phone_number    TEXT    NOT NULL
);


CREATE TABLE IF NOT EXISTS party
(
    id              SERIAL  PRIMARY KEY NOT NULL,
    name            TEXT    NOT NULL,
    location        TEXT    NOT NULL,
    description     TEXT    NOT NULL
);


CREATE TYPE RsvpStatus AS ENUM ('no', 'yes', 'maybe');

CREATE TABLE IF NOT EXISTS invitation
(
    id          SERIAL      PRIMARY KEY NOT NULL,
    guest_id    BIGINT      REFERENCES guests(id) NOT NULL ,
    party_id    BIGINT      REFERENCES party(id) NOT NULL ,
    status      RsvpStatus  NOT NULL
);