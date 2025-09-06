-- Migration to update jobs table for trucking/excavation business
-- Run this on your Supabase instance

-- Add new columns to jobs table
ALTER TABLE "jobs" 
  ADD COLUMN IF NOT EXISTS "contact_person" varchar(255),
  ADD COLUMN IF NOT EXISTS "contact_number" varchar(50),
  ADD COLUMN IF NOT EXISTS "rego" varchar(20), -- Vehicle registration
  ADD COLUMN IF NOT EXISTS "load_number" integer DEFAULT 1, -- Load count for the day
  ADD COLUMN IF NOT EXISTS "company_name" varchar(255), -- Company/customer name
  ADD COLUMN IF NOT EXISTS "address_site" text, -- Full address/site description
  ADD COLUMN IF NOT EXISTS "equipment_type" varchar(100), -- Truck & Trailer 22m3, Tandem 10m3, etc.
  ADD COLUMN IF NOT EXISTS "material_type" varchar(100), -- Dry Clean Fill, etc.
  ADD COLUMN IF NOT EXISTS "price_per_unit" numeric(10, 2), -- Price per cubic metre
  ADD COLUMN IF NOT EXISTS "cubic_metre_capacity" integer, -- Load capacity in m3
  ADD COLUMN IF NOT EXISTS "job_date" date; -- Date of the job

-- Update existing columns to be optional since we'll migrate data
ALTER TABLE "jobs" 
  ALTER COLUMN "source_location" DROP NOT NULL,
  ALTER COLUMN "dirt_type" DROP NOT NULL,
  ALTER COLUMN "quantity_cubic_meters" DROP NOT NULL,
  ALTER COLUMN "price_per_cubic_meter" DROP NOT NULL,
  ALTER COLUMN "total_amount" DROP NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "jobs_contact_person_idx" ON "jobs" ("contact_person");
CREATE INDEX IF NOT EXISTS "jobs_rego_idx" ON "jobs" ("rego");
CREATE INDEX IF NOT EXISTS "jobs_company_name_idx" ON "jobs" ("company_name");
CREATE INDEX IF NOT EXISTS "jobs_job_date_idx" ON "jobs" ("job_date");

-- Add comment to explain the table usage
COMMENT ON TABLE "jobs" IS 'Stores trucking/excavation jobs with load tracking';

-- Sample insert to test the structure
-- This shows how to insert jobs with the new format
/*
INSERT INTO jobs (
  team_id,
  customer_id,
  job_number,
  contact_person,
  contact_number,
  rego,
  load_number,
  company_name,
  address_site,
  equipment_type,
  material_type,
  price_per_unit,
  cubic_metre_capacity,
  job_date,
  status
) VALUES (
  'YOUR_TEAM_ID',
  'YOUR_CUSTOMER_ID',
  '64253-033',
  'Suthaman',
  '0438450153',
  'CQI782',
  2,
  'EPH',
  'Gate121 Eastern Freeway',
  'Truck & Trailer 22m3',
  'Dry Clean Fill',
  15.00,
  22,
  '2025-08-25',
  'pending'
);
*/