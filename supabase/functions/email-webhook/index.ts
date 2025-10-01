import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { EmailSyncManager } from "../../../packages/email-providers/src/email-sync-manager.ts";
import { QueueManager } from "../../../packages/queue/src/queue-manager.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const provider = req.headers.get("x-email-provider");
    
    if (!provider || !["gmail", "outlook"].includes(provider)) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing email provider" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const payload = await req.json();
    
    const redisConfig = {
      redis: {
        host: Deno.env.get("REDIS_HOST") || "localhost",
        port: parseInt(Deno.env.get("REDIS_PORT") || "6379"),
        password: Deno.env.get("REDIS_PASSWORD"),
        db: parseInt(Deno.env.get("REDIS_DB") || "0"),
      },
    };

    const queueManager = new QueueManager(redisConfig);
    const emailSyncManager = new EmailSyncManager(queueManager);

    if (provider === "gmail") {
      const pubsubMessage = payload.message;
      
      if (!pubsubMessage) {
        return new Response(
          JSON.stringify({ error: "Invalid Gmail Pub/Sub message" }),
          { 
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const decodedData = JSON.parse(
        atob(pubsubMessage.data)
      );

      await emailSyncManager.processWebhook("gmail", decodedData);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Gmail webhook processed" 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else if (provider === "outlook") {
      const validationToken = req.url.searchParams.get("validationToken");
      
      if (validationToken) {
        return new Response(validationToken, {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "text/plain" },
        });
      }

      const notifications = payload.value;
      
      if (!notifications || !Array.isArray(notifications)) {
        return new Response(
          JSON.stringify({ error: "Invalid Outlook notification payload" }),
          { 
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      for (const notification of notifications) {
        await emailSyncManager.processWebhook("outlook", notification);
      }
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: `Processed ${notifications.length} Outlook notifications` 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unsupported provider" }),
      { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Email webhook error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});