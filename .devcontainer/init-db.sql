-- Create the party database schema

-- Create custom enum type for RSVP status
CREATE TYPE RsvpStatus AS ENUM ('no', 'yes', 'maybe');

-- Create guests table
CREATE TABLE IF NOT EXISTS guests (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL
);

-- Create party table
CREATE TABLE IF NOT EXISTS party (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT,
    date TIMESTAMPTZ
);

-- Create invitation table
CREATE TABLE IF NOT EXISTS invitation (
    id SERIAL PRIMARY KEY,
    guest_id BIGINT NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    party_id BIGINT NOT NULL REFERENCES party(id) ON DELETE CASCADE,
    status RsvpStatus NOT NULL DEFAULT 'maybe',
    UNIQUE(guest_id, party_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invitation_guest_id ON invitation(guest_id);
CREATE INDEX IF NOT EXISTS idx_invitation_party_id ON invitation(party_id);
CREATE INDEX IF NOT EXISTS idx_party_date ON party(date);