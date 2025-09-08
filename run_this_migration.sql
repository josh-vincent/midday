-- Combined migration to fix invoice functionality
-- Run this in Supabase SQL Editor

-- 1. Create missing functions
CREATE OR REPLACE FUNCTION get_next_invoice_number(p_team_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_last_number INTEGER;
    v_prefix TEXT;
    v_next_number TEXT;
BEGIN
    -- Get the last invoice number for this team
    SELECT 
        COALESCE(
            MAX(
                CASE 
                    WHEN invoice_number ~ '^INV-[0-9]+$' 
                    THEN CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)
                    ELSE 0
                END
            ), 
            0
        ) INTO v_last_number
    FROM invoices
    WHERE team_id = p_team_id;
    
    -- Generate the next number
    v_next_number := 'INV-' || LPAD((v_last_number + 1)::TEXT, 5, '0');
    
    RETURN v_next_number;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_payment_score(p_team_id UUID)
RETURNS TABLE(
    score INTEGER,
    total_invoices INTEGER,
    paid_on_time INTEGER,
    paid_late INTEGER,
    unpaid_overdue INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH invoice_stats AS (
        SELECT 
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE status = 'paid' AND (paid_date IS NULL OR paid_date <= due_date)) AS on_time,
            COUNT(*) FILTER (WHERE status = 'paid' AND paid_date > due_date) AS late,
            COUNT(*) FILTER (WHERE status IN ('unpaid', 'pending') AND due_date < CURRENT_DATE) AS overdue
        FROM invoices
        WHERE team_id = p_team_id
    )
    SELECT 
        CASE 
            WHEN total = 0 THEN 100
            WHEN on_time = total THEN 100
            ELSE GREATEST(0, ROUND(100.0 * on_time / NULLIF(total - overdue, 0))::INTEGER)
        END AS score,
        total::INTEGER AS total_invoices,
        on_time::INTEGER AS paid_on_time,
        late::INTEGER AS paid_late,
        overdue::INTEGER AS unpaid_overdue
    FROM invoice_stats;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_next_invoice_number(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_payment_score(UUID) TO authenticated;

-- 2. Add missing columns to invoices table
DO $$ 
BEGIN
    -- Add missing label columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'invoice_no_label') THEN
        ALTER TABLE invoices ADD COLUMN invoice_no_label TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'issue_date_label') THEN
        ALTER TABLE invoices ADD COLUMN issue_date_label TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'due_date_label') THEN
        ALTER TABLE invoices ADD COLUMN due_date_label TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'description_label') THEN
        ALTER TABLE invoices ADD COLUMN description_label TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'price_label') THEN
        ALTER TABLE invoices ADD COLUMN price_label TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'quantity_label') THEN
        ALTER TABLE invoices ADD COLUMN quantity_label TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'total_label') THEN
        ALTER TABLE invoices ADD COLUMN total_label TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'vat_label') THEN
        ALTER TABLE invoices ADD COLUMN vat_label TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'tax_label') THEN
        ALTER TABLE invoices ADD COLUMN tax_label TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'payment_label') THEN
        ALTER TABLE invoices ADD COLUMN payment_label TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'note_label') THEN
        ALTER TABLE invoices ADD COLUMN note_label TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'size') THEN
        ALTER TABLE invoices ADD COLUMN size TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'date_format') THEN
        ALTER TABLE invoices ADD COLUMN date_format TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'include_vat') THEN
        ALTER TABLE invoices ADD COLUMN include_vat BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'include_tax') THEN
        ALTER TABLE invoices ADD COLUMN include_tax BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'delivery_type') THEN
        ALTER TABLE invoices ADD COLUMN delivery_type TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'discount_label') THEN
        ALTER TABLE invoices ADD COLUMN discount_label TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'include_discount') THEN
        ALTER TABLE invoices ADD COLUMN include_discount BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'include_decimals') THEN
        ALTER TABLE invoices ADD COLUMN include_decimals BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'total_summary_label') THEN
        ALTER TABLE invoices ADD COLUMN total_summary_label TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'title') THEN
        ALTER TABLE invoices ADD COLUMN title TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'vat_rate') THEN
        ALTER TABLE invoices ADD COLUMN vat_rate NUMERIC(5,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'include_units') THEN
        ALTER TABLE invoices ADD COLUMN include_units BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'subtotal_label') THEN
        ALTER TABLE invoices ADD COLUMN subtotal_label TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'include_pdf') THEN
        ALTER TABLE invoices ADD COLUMN include_pdf BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'send_copy') THEN
        ALTER TABLE invoices ADD COLUMN send_copy BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'sent_at') THEN
        ALTER TABLE invoices ADD COLUMN sent_at TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'reminder_sent_at') THEN
        ALTER TABLE invoices ADD COLUMN reminder_sent_at TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'viewed_at') THEN
        ALTER TABLE invoices ADD COLUMN viewed_at TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'downloaded_at') THEN
        ALTER TABLE invoices ADD COLUMN downloaded_at TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'metadata') THEN
        ALTER TABLE invoices ADD COLUMN metadata JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'created_by') THEN
        ALTER TABLE invoices ADD COLUMN created_by UUID REFERENCES users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'created_at') THEN
        ALTER TABLE invoices ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'updated_at') THEN
        ALTER TABLE invoices ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- 3. Make customerId nullable for draft invoices
ALTER TABLE invoices ALTER COLUMN customer_id DROP NOT NULL;