ALTER TABLE "transaction_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP INDEX "transaction_categories_team_id_idx";--> statement-breakpoint
DROP INDEX "transaction_categories_parent_id_idx";--> statement-breakpoint
CREATE INDEX "transaction_categories_team_id_idx" ON "transaction_categories" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "transaction_categories_parent_id_idx" ON "transaction_categories" USING btree ("parent_id");--> statement-breakpoint
CREATE POLICY "Users on team can manage categories" ON "transaction_categories" AS PERMISSIVE FOR ALL TO public USING ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));