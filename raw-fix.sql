-- Clear teamId for admin@tocld.com user
UPDATE users SET team_id = NULL WHERE email = 'admin@tocld.com';

-- Check the result
SELECT id, email, full_name, team_id FROM users WHERE email = 'admin@tocld.com';