import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { StripeWebhookHandler } from "../../../packages/stripe-sync/src/webhook-handler.ts";
import { QueueManager } from "../../../packages/queue/src/queue-manager.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing Stripe signature" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const rawBody = await req.text();
    
    const stripeConfig = {
      secretKey: Deno.env.get("STRIPE_SECRET_KEY")!,
      webhookSecret: Deno.env.get("STRIPE_WEBHOOK_SECRET")!,
      apiVersion: "2024-11-20.acacia",
    };

    const redisConfig = {
      redis: {
        host: Deno.env.get("REDIS_HOST") || "localhost",
        port: parseInt(Deno.env.get("REDIS_PORT") || "6379"),
        password: Deno.env.get("REDIS_PASSWORD"),
        db: parseInt(Deno.env.get("REDIS_DB") || "0"),
      },
    };

    const queueManager = new QueueManager(redisConfig);
    const webhookHandler = new StripeWebhookHandler(
      stripeConfig,
      queueManager,
      {
        queueEnabled: true,
        maxRetries: 3,
        logLevel: "info",
      }
    );

    const result = await webhookHandler.handleWebhook(rawBody, signature);

    if (result.success) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          eventId: result.eventId,
          message: "Webhook processed successfully" 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.error 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error: any) {
    console.error("Stripe webhook error:", error);
    
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