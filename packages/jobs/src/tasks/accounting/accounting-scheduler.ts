import { createClient } from "@midday/supabase/job";
import { logger, schedules } from "@trigger.dev/sdk";
import { syncAccountingData } from "./sync-data";

/**
 * Scheduled task to sync accounting data for all enabled connections
 * This is a fan-out pattern - triggers a sync-data job for each accounting connection
 * Runs daily to sync accounting data from providers
 */
export const accountingSyncScheduler = schedules.task({
  id: "accounting-sync-scheduler",
  cron: "0 2 * * *", // Run at 2 AM every day
  maxDuration: 300, // 5 minutes
  run: async (payload) => {
    // Only run in production (Set in Trigger.dev)
    if (process.env.TRIGGER_ENVIRONMENT !== "production") return;

    const supabase = createClient();

    const teamId = payload.externalId;

    if (!teamId) {
      throw new Error("teamId is required");
    }

    try {
      // Get all enabled accounting connections for this team
      const { data: accountingConnections } = await supabase
        .from("accounting_connections")
        .select("id, team_id, user_id, provider, sync_enabled")
        .eq("team_id", teamId)
        .eq("sync_enabled", true)
        .throwOnError();

      const formattedConnections = accountingConnections?.map((connection) => ({
        payload: {
          connectionId: connection.id,
          teamId: connection.team_id,
          userId: connection.user_id,
        },
        tags: ["team_id", teamId, "provider", connection.provider],
      }));

      // If there are no accounting connections to sync, return
      if (!formattedConnections?.length) {
        logger.info("No accounting connections to sync");
        return;
      }

      logger.info(`Triggering sync for ${formattedConnections.length} accounting connections`);

      // Trigger sync for all connections
      await syncAccountingData.batchTrigger(formattedConnections);

      logger.info("Accounting sync scheduler completed");
    } catch (error) {
      logger.error("Failed to schedule accounting syncs", { error });
      throw error;
    }
  },
});
