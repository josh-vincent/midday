-- Make customerId optional in jobs table
ALTER TABLE "jobs" ALTER COLUMN "customer_id" DROP NOT NULL;