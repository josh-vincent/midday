-- Create tags table if it doesn't exist
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7), -- Hex color code like #FF0000
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tags_team_id ON tags(team_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- Add unique constraint to prevent duplicate tag names per team
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_team_name ON tags(team_id, name);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_tags_updated_at ON tags;
CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON tags TO authenticated;
GRANT ALL ON tags TO service_role;

-- Enable RLS (Row Level Security)
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view tags from their team" ON tags
    FOR SELECT USING (team_id IN (
        SELECT team_id FROM users_on_team WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can create tags for their team" ON tags
    FOR INSERT WITH CHECK (team_id IN (
        SELECT team_id FROM users_on_team WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update tags from their team" ON tags
    FOR UPDATE USING (team_id IN (
        SELECT team_id FROM users_on_team WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can delete tags from their team" ON tags
    FOR DELETE USING (team_id IN (
        SELECT team_id FROM users_on_team WHERE user_id = auth.uid()
    ));

-- Insert some sample tags for testing (optional)
-- INSERT INTO tags (team_id, name, color) 
-- SELECT 
--     '45ef1539-1fec-4d7c-9465-d707fc288da5'::uuid,
--     tag_name,
--     tag_color
-- FROM (VALUES 
--     ('Urgent', '#FF0000'),
--     ('Important', '#FFA500'),
--     ('Review', '#0000FF'),
--     ('Pending', '#808080')
-- ) AS t(tag_name, tag_color)
-- WHERE NOT EXISTS (
--     SELECT 1 FROM tags 
--     WHERE team_id = '45ef1539-1fec-4d7c-9465-d707fc288da5'::uuid 
--     AND name = t.tag_name
-- );

SELECT 'Tags table created successfully' as status;