-- Script to import sample jobs data
-- First run the jobs_table_migration.sql to add the new columns
-- Then run this script to import the data

-- Replace these with your actual IDs
-- You can find your team_id by running: SELECT id, name FROM teams;
-- You can find or create customer IDs by running: SELECT id, name FROM customers;

-- Set your team ID here
DO $$
DECLARE
  v_team_id UUID := 'YOUR_TEAM_ID_HERE'; -- Replace with actual team ID
  v_customer_id UUID;
BEGIN
  -- Create customers if they don't exist (you may want to adjust this)
  -- For now, we'll use a single customer ID for simplicity
  -- In production, you'd want to create/link proper customer records
  
  -- Get or create a default customer
  INSERT INTO customers (team_id, name, email, status)
  VALUES (v_team_id, 'Default Trucking Customer', 'trucking@example.com', 'active')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_customer_id;
  
  IF v_customer_id IS NULL THEN
    SELECT id INTO v_customer_id FROM customers 
    WHERE team_id = v_team_id AND name = 'Default Trucking Customer';
  END IF;

  -- Insert the jobs data
  INSERT INTO jobs (
    team_id,
    customer_id,
    contact_person,
    contact_number,
    rego,
    load_number,
    company_name,
    job_number,
    address_site,
    equipment_type,
    material_type,
    price_per_unit,
    cubic_metre_capacity,
    job_date,
    status,
    total_amount
  ) VALUES
  (v_team_id, v_customer_id, 'Suthaman', '0438450153', 'CQI782', 2, 'EPH', '64253-033', 'Gate121 Eastern Freeway', 'Truck & Trailer 22m3', 'Dry Clean Fill', 15.00, 22, '2025-08-25', 'pending', 33000),
  (v_team_id, v_customer_id, 'Don', '0410395176', 'XV54UG', 3, 'RMR', 'Account', '9 Victoria Cres Mont Albert', 'Tandem 10m3', 'Dry Clean Fill', 15.00, 10, '2025-08-25', 'pending', 15000),
  (v_team_id, v_customer_id, 'Duc', '0435948888', 'XW88HW', 5, 'EPH', '64541-003', '18 Mccubin St Burwood', 'Tandem 10m3', 'Dry Clean Fill', 15.00, 10, '2025-08-25', 'pending', 15000),
  (v_team_id, v_customer_id, 'Ham', '0412476071', 'XV89BW', 1, 'EPH', '64253-033', 'Gate121 Eastern Freeway', 'Truck & Trailer 22m3', 'Dry Clean Fill', 15.00, 22, '2025-08-25', 'pending', 33000),
  (v_team_id, v_customer_id, 'Steve', '0429702758', 'DHY759', 3, 'Gedye Excavations', 'invoice', '81 Ayr St Doncaster', 'Tandem 10m3', 'Dry Clean Fill', 15.00, 10, '2025-08-25', 'pending', 15000),
  (v_team_id, v_customer_id, 'Will', '0407260458', 'EPH8', 5, 'EPH', '64253-033', 'Gate121 Eastern Freeway', 'Truck & Trailer 22m3', 'Dry Clean Fill', 15.00, 22, '2025-08-25', 'pending', 33000),
  (v_team_id, v_customer_id, 'Steve', '0403855288', 'XIZ334', 4, 'RMR', 'Account', '11 Cairnes Cres East Malvern', 'Tandem 10m3', 'Dry Clean Fill', 15.00, 10, '2025-08-25', 'pending', 15000),
  (v_team_id, v_customer_id, 'Chin', '0421777669', 'XW39UG', 1, 'EPH', '64253-033', 'Gate121 Eastern Freeway', 'Truck & Quad 26m3', 'Dry Clean Fill', 15.00, 26, '2025-08-25', 'pending', 39000),
  (v_team_id, v_customer_id, 'Hayden', '0417013601', 'RKH394', 2, 'RMR', 'Account', '45 Findlayson Rosanna', 'Tandem 10m3', 'Dry Clean Fill', 15.00, 10, '2025-08-25', 'pending', 15000),
  (v_team_id, v_customer_id, 'Josh', '0437167734', 'XW49FV', 3, 'Enchanted Pools', 'invoice', '9 Ashton Rd Fern Tree Gully', 'Tandem 10m3', 'Dry Clean Fill', 15.00, 10, '2025-08-25', 'pending', 15000),
  (v_team_id, v_customer_id, 'Scott', '0421132433', '1NO5FX', 3, 'Enchanted Pools', 'invoice', '9 Ashton Rd Fern Tree Gully', 'Tandem 10m3', 'Dry Clean Fill', 15.00, 10, '2025-08-25', 'pending', 15000),
  (v_team_id, v_customer_id, 'Mark', '0448817557', 'XQ51NH', 3, 'Bullseye Building and Excavation', 'invoice', '645 Fern Tree Gully Rd Glen Waverly', 'Tandem 10m3', 'Dry Clean Fill', 15.00, 10, '2025-08-25', 'pending', 15000),
  (v_team_id, v_customer_id, 'Lucas', '0430044249', 'XV5ZG', 2, 'RMR', 'Account', '11 Cairnes Cres East Malvern', 'Tandem 10m3', 'Dry Clean Fill', 15.00, 10, '2025-08-25', 'pending', 15000),
  (v_team_id, v_customer_id, 'Ben', '0447507152', 'XV88VS', 1, 'Down To Earth', 'invoice', '37 Packenham Blackburn', 'Tandem 10m3', 'Dry Clean Fill', 15.00, 10, '2025-08-25', 'pending', 15000);

  RAISE NOTICE 'Successfully imported % job records', 14;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error importing jobs: %', SQLERRM;
    RAISE NOTICE 'Make sure to replace YOUR_TEAM_ID_HERE with your actual team ID';
END $$;

-- Query to verify the imported data
SELECT 
  contact_person,
  contact_number,
  rego,
  load_number,
  company_name,
  job_number,
  address_site,
  equipment_type,
  material_type,
  price_per_unit,
  cubic_metre_capacity,
  job_date
FROM jobs
WHERE job_date = '2025-08-25'
ORDER BY created_at DESC
LIMIT 20;