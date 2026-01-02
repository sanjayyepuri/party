-- Fix transports column type from text[] to text
-- The passkey plugin stores transports as a comma-separated string, not a PostgreSQL array

-- Convert any existing array data to comma-separated string and change column type
ALTER TABLE "passkey" 
ALTER COLUMN "transports" TYPE text 
USING CASE 
  WHEN "transports" IS NULL THEN NULL
  ELSE array_to_string("transports"::text[], ',')
END;

