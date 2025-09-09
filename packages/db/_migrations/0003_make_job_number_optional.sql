-- Make jobNumber optional in jobs table
ALTER TABLE "jobs" ALTER COLUMN "job_number" DROP NOT NULL;