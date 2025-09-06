-- Test query to verify all template fields are working correctly
-- Run this against your Supabase database to verify the migration

-- 1. Check if all columns exist in invoice_templates
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'invoice_templates'
  AND column_name IN (
    'from_details',
    'payment_details',
    'note_details',
    'title',
    'logo_url',
    'currency',
    'date_format',
    'size',
    'delivery_type',
    'customer_label',
    'from_label',
    'invoice_no_label',
    'issue_date_label',
    'due_date_label',
    'description_label',
    'price_label',
    'quantity_label',
    'total_label',
    'total_summary_label',
    'vat_label',
    'tax_label',
    'subtotal_label',
    'discount_label',
    'payment_label',
    'note_label',
    'include_vat',
    'include_tax',
    'include_discount',
    'include_decimals',
    'include_pdf',
    'include_units',
    'send_copy',
    'tax_rate',
    'vat_rate'
  )
ORDER BY column_name;

-- 2. Check if all columns exist in invoices
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'invoices'
  AND column_name IN (
    'from_details',
    'customer_details',
    'note_details',
    'template',
    'token',
    'amount',
    'user_id',
    'customer_name',
    'invoice_date',
    'tax',
    'vat',
    'discount',
    'top_block',
    'bottom_block',
    'scheduled_at',
    'scheduled_job_id',
    'logo_url'
  )
ORDER BY column_name;

-- 3. Test inserting/updating a template with all fields
DO $$
DECLARE
  test_team_id UUID;
  test_template_id UUID;
BEGIN
  -- Get a team ID (use the first one found)
  SELECT id INTO test_team_id FROM teams LIMIT 1;
  
  IF test_team_id IS NULL THEN
    RAISE NOTICE 'No teams found in database';
    RETURN;
  END IF;
  
  -- Try to update existing template or create new one
  INSERT INTO invoice_templates (
    team_id,
    name,
    description,
    is_default,
    -- Content fields
    from_details,
    payment_details,
    note_details,
    title,
    logo_url,
    -- Format settings
    currency,
    date_format,
    size,
    delivery_type,
    -- Labels
    customer_label,
    from_label,
    invoice_no_label,
    issue_date_label,
    due_date_label,
    description_label,
    price_label,
    quantity_label,
    total_label,
    total_summary_label,
    vat_label,
    tax_label,
    subtotal_label,
    discount_label,
    payment_label,
    note_label,
    -- Toggles
    include_vat,
    include_tax,
    include_discount,
    include_decimals,
    include_pdf,
    include_units,
    send_copy,
    -- Rates
    tax_rate,
    vat_rate,
    created_at,
    updated_at
  ) VALUES (
    test_team_id,
    'Test Template',
    'Testing all fields',
    true,
    -- Content fields
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Test Company"}]}]}',
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Bank: Test Bank"}]}]}',
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Thank you!"}]}]}',
    'Test Invoice',
    'https://example.com/logo.png',
    -- Format settings
    'USD',
    'MM/dd/yyyy',
    'letter',
    'email',
    -- Labels
    'Bill To',
    'From',
    'Invoice #',
    'Date',
    'Due Date',
    'Item',
    'Rate',
    'Qty',
    'Amount',
    'Total Due',
    'Sales Tax',
    'Tax',
    'Subtotal',
    'Discount',
    'Payment Info',
    'Notes',
    -- Toggles
    true,
    true,
    true,
    true,
    true,
    false,
    true,
    -- Rates
    8.5,
    10.0,
    NOW(),
    NOW()
  )
  ON CONFLICT (team_id, is_default) WHERE is_default = true
  DO UPDATE SET
    from_details = EXCLUDED.from_details,
    payment_details = EXCLUDED.payment_details,
    note_details = EXCLUDED.note_details,
    title = EXCLUDED.title,
    updated_at = NOW()
  RETURNING id INTO test_template_id;
  
  RAISE NOTICE 'Template test successful. ID: %', test_template_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error during template test: %', SQLERRM;
END $$;

-- 4. Verify the data was saved correctly (no [Object object])
SELECT 
  id,
  team_id,
  name,
  -- Check that JSON fields don't contain [Object object]
  CASE 
    WHEN from_details::text LIKE '%[Object object]%' OR from_details::text LIKE '%[object Object]%'
    THEN 'ERROR: Contains [Object object]'
    ELSE 'OK'
  END as from_details_check,
  CASE 
    WHEN payment_details::text LIKE '%[Object object]%' OR payment_details::text LIKE '%[object Object]%'
    THEN 'ERROR: Contains [Object object]'
    ELSE 'OK'
  END as payment_details_check,
  CASE 
    WHEN note_details::text LIKE '%[Object object]%' OR note_details::text LIKE '%[object Object]%'
    THEN 'ERROR: Contains [Object object]'
    ELSE 'OK'
  END as note_details_check,
  -- Show actual content (truncated)
  LEFT(from_details::text, 50) as from_preview,
  LEFT(payment_details::text, 50) as payment_preview,
  LEFT(note_details::text, 50) as note_preview
FROM invoice_templates
WHERE name = 'Test Template'
   OR is_default = true
LIMIT 5;

-- 5. Final summary
SELECT 
  'invoice_templates' as table_name,
  COUNT(*) as total_templates,
  COUNT(CASE WHEN is_default = true THEN 1 END) as default_templates,
  COUNT(CASE WHEN from_details IS NOT NULL THEN 1 END) as with_from_details,
  COUNT(CASE WHEN payment_details IS NOT NULL THEN 1 END) as with_payment_details,
  COUNT(CASE WHEN note_details IS NOT NULL THEN 1 END) as with_note_details
FROM invoice_templates;