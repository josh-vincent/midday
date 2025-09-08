-- Create function to get the next invoice number
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

-- Create function to calculate payment score for a team
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