-- Create users_on_team table if it doesn't exist
CREATE TABLE IF NOT EXISTS "users_on_team" (
    "user_id" uuid NOT NULL,
    "team_id" uuid NOT NULL,
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "role" "teamRoles",
    "created_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "members_pkey" PRIMARY KEY("user_id", "team_id", "id")
);

-- Add foreign key constraints
ALTER TABLE "users_on_team" 
ADD CONSTRAINT "users_on_team_team_id_fkey" 
FOREIGN KEY ("team_id") REFERENCES "teams"("id") 
ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "users_on_team" 
ADD CONSTRAINT "users_on_team_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "users"("id") 
ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "users_on_team_team_id_idx" ON "users_on_team" USING btree ("team_id" ASC NULLS LAST);
CREATE INDEX IF NOT EXISTS "users_on_team_user_id_idx" ON "users_on_team" USING btree ("user_id" ASC NULLS LAST);

-- Add RLS policies for the users_on_team table
ALTER TABLE "users_on_team" ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to insert
CREATE POLICY "Enable insert for authenticated users only" ON "users_on_team"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy to allow reading teams you belong to
CREATE POLICY "Users can view teams they belong to" ON "users_on_team"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy to allow team owners to manage members
CREATE POLICY "Team owners can manage members" ON "users_on_team"
AS PERMISSIVE FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users_on_team uot
        WHERE uot.team_id = users_on_team.team_id
        AND uot.user_id = auth.uid()
        AND uot.role = 'owner'
    )
);

-- Insert default team membership for existing users if they have teams but no membership records
INSERT INTO users_on_team (user_id, team_id, role)
SELECT DISTINCT 
    u.id as user_id,
    t.id as team_id,
    'owner'::teamRoles as role
FROM users u
CROSS JOIN teams t
WHERE NOT EXISTS (
    SELECT 1 FROM users_on_team uot 
    WHERE uot.user_id = u.id AND uot.team_id = t.id
)
AND EXISTS (
    -- Only add if there's some relationship (e.g., user created an invoice for this team)
    SELECT 1 FROM invoices i 
    WHERE i.created_by = u.id AND i.team_id = t.id
)
ON CONFLICT DO NOTHING;