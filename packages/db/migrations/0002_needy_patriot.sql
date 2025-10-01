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

-- Create get_payment_score function if it doesn't exist
CREATE OR REPLACE FUNCTION get_payment_score(
    p_team_id UUID,
    p_customer_id UUID DEFAULT NULL,
    p_invoice_status invoice_status DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_score INTEGER DEFAULT 50;
    v_paid_count INTEGER;
    v_overdue_count INTEGER;
    v_avg_payment_days FLOAT;
BEGIN
    -- Base query conditions
    IF p_customer_id IS NOT NULL THEN
        -- Customer-specific score
        SELECT 
            COUNT(CASE WHEN status = 'paid' THEN 1 END),
            COUNT(CASE WHEN status = 'overdue' THEN 1 END),
            AVG(CASE 
                WHEN status = 'paid' AND paid_date IS NOT NULL AND sent_at IS NOT NULL 
                THEN EXTRACT(DAY FROM (paid_date::timestamp - sent_at::timestamp))
                ELSE NULL
            END)
        INTO v_paid_count, v_overdue_count, v_avg_payment_days
        FROM invoices
        WHERE team_id = p_team_id 
        AND customer_id = p_customer_id
        AND created_at > NOW() - INTERVAL '6 months';
    ELSE
        -- Team-wide score
        SELECT 
            COUNT(CASE WHEN status = 'paid' THEN 1 END),
            COUNT(CASE WHEN status = 'overdue' THEN 1 END),
            AVG(CASE 
                WHEN status = 'paid' AND paid_date IS NOT NULL AND sent_at IS NOT NULL 
                THEN EXTRACT(DAY FROM (paid_date::timestamp - sent_at::timestamp))
                ELSE NULL
            END)
        INTO v_paid_count, v_overdue_count, v_avg_payment_days
        FROM invoices
        WHERE team_id = p_team_id
        AND created_at > NOW() - INTERVAL '6 months';
    END IF;
    
    -- Calculate score based on payment history
    -- Start with base score
    v_score := 50;
    
    -- Adjust for paid vs overdue ratio
    IF v_paid_count + v_overdue_count > 0 THEN
        v_score := v_score + (v_paid_count * 10 - v_overdue_count * 15);
    END IF;
    
    -- Adjust for average payment speed
    IF v_avg_payment_days IS NOT NULL THEN
        IF v_avg_payment_days <= 7 THEN
            v_score := v_score + 20;
        ELSIF v_avg_payment_days <= 14 THEN
            v_score := v_score + 10;
        ELSIF v_avg_payment_days <= 30 THEN
            v_score := v_score + 5;
        ELSIF v_avg_payment_days > 60 THEN
            v_score := v_score - 10;
        END IF;
    END IF;
    
    -- Apply status-based adjustments if provided
    IF p_invoice_status IS NOT NULL THEN
        CASE p_invoice_status
            WHEN 'paid' THEN v_score := v_score + 5;
            WHEN 'overdue' THEN v_score := v_score - 5;
            WHEN 'canceled' THEN v_score := v_score - 10;
            ELSE NULL;
        END CASE;
    END IF;
    
    -- Ensure score is within 0-100 range
    IF v_score < 0 THEN
        v_score := 0;
    ELSIF v_score > 100 THEN
        v_score := 100;
    END IF;
    
    RETURN v_score;
END;
$$ LANGUAGE plpgsql;