-- Fix get_next_invoice_number function to handle INV- prefix format
CREATE OR REPLACE FUNCTION get_next_invoice_number(p_team_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    v_last_number BIGINT;
    v_new_number VARCHAR;
BEGIN
    -- Get the highest numeric part from all invoice numbers for this team
    -- Handles formats like: INV-00001, INV-2025-0001, or plain numbers
    SELECT COALESCE(MAX(CAST(REGEXP_REPLACE(invoice_number, '[^0-9]', '', 'g') AS BIGINT)), 0)
    INTO v_last_number
    FROM invoices
    WHERE team_id = p_team_id
    AND invoice_number IS NOT NULL
    AND invoice_number != '';

    -- Increment the number
    v_new_number := (v_last_number + 1)::VARCHAR;

    RETURN v_new_number;
END;
$$ LANGUAGE plpgsql;