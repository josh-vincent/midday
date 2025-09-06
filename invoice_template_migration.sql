-- Add missing fields to invoice_templates table for storing template configuration
-- Run this migration on your Supabase instance

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