-- Fix duplicate get_payment_score function
-- Drop the incorrect version that returns INTEGER with 3 parameters
-- Keep the correct version that returns TABLE with 1 parameter

-- Drop the function with 3 parameters (if it exists)
DROP FUNCTION IF EXISTS get_payment_score(UUID, UUID, invoice_status);

-- Ensure the correct version exists (returns TABLE with team_id only)
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
GRANT EXECUTE ON FUNCTION get_payment_score(UUID) TO authenticated;
