-- Complete migration for invoice templates and invoices tables
-- Run this on your remote Supabase instance

-- ========================================
-- PART 1: Add missing fields to invoice_templates table
-- ========================================

-- Add content fields for storing template data
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "from_details" text;
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "note_details" text;
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "title" varchar(255) DEFAULT 'Invoice';

-- Add format settings
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "currency" varchar(3) DEFAULT 'AUD';
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "date_format" varchar(20) DEFAULT 'dd/MM/yyyy';
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "size" varchar(10) DEFAULT 'a4';
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "delivery_type" varchar(20) DEFAULT 'create';

-- Add label customization fields
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "customer_label" varchar(255) DEFAULT 'To';
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "from_label" varchar(255) DEFAULT 'From';
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "invoice_no_label" varchar(255) DEFAULT 'Invoice No';
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "issue_date_label" varchar(255) DEFAULT 'Issue Date';
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "due_date_label" varchar(255) DEFAULT 'Due Date';
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "description_label" varchar(255) DEFAULT 'Description';
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "price_label" varchar(255) DEFAULT 'Price';
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "quantity_label" varchar(255) DEFAULT 'Quantity';
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "total_label" varchar(255) DEFAULT 'Total';
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "total_summary_label" varchar(255) DEFAULT 'Total';
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "vat_label" varchar(255) DEFAULT 'VAT';
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "tax_label" varchar(255) DEFAULT 'Tax';
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "subtotal_label" varchar(255) DEFAULT 'Subtotal';
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "discount_label" varchar(255) DEFAULT 'Discount';
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "payment_label" varchar(255) DEFAULT 'Payment Details';
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "note_label" varchar(255) DEFAULT 'Note';

-- Add boolean toggles for features
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "include_vat" boolean DEFAULT false;
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "include_tax" boolean DEFAULT false;
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "include_discount" boolean DEFAULT false;
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "include_decimals" boolean DEFAULT true;
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "include_pdf" boolean DEFAULT true;
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "include_units" boolean DEFAULT false;
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "send_copy" boolean DEFAULT false;

-- Add tax/VAT rate fields
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "tax_rate" numeric(5, 2) DEFAULT 0;
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "vat_rate" numeric(5, 2) DEFAULT 0;

-- ========================================
-- PART 2: Add missing fields to invoices table for draft storage
-- ========================================

-- Add fields for storing invoice-specific content
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "from_details" text;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "customer_details" text;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "note_details" text;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "template" jsonb;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "token" text;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "amount" integer DEFAULT 0;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "user_id" uuid REFERENCES users(id);
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "customer_name" text;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "invoice_date" date;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "tax" integer DEFAULT 0;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "vat" integer DEFAULT 0;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "discount" integer DEFAULT 0;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "top_block" text;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "bottom_block" text;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "scheduled_at" timestamp;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "scheduled_job_id" text;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "logo_url" text;

-- ========================================
-- PART 3: Create default templates for existing teams
-- ========================================

-- Create a default template for each team that doesn't have one
INSERT INTO invoice_templates (
  team_id,
  name,
  description,
  is_default,
  created_at,
  updated_at
)
SELECT 
  t.id as team_id,
  'Default Template' as name,
  'Standard invoice template' as description,
  true as is_default,
  NOW() as created_at,
  NOW() as updated_at
FROM teams t
WHERE NOT EXISTS (
  SELECT 1 
  FROM invoice_templates it 
  WHERE it.team_id = t.id
);