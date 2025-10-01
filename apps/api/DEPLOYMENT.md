# API Deployment to Vercel

This Hono API can be deployed to Vercel as serverless functions.

## Prerequisites

- Vercel account
- GitHub repository connected to Vercel

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Select the `apps/api` directory as the root
5. Configure environment variables (see below)
6. Click "Deploy"

### Option 2: Deploy via Vercel CLI

```bash
cd apps/api
vercel
```

Follow the prompts to link your project and deploy.

## Required Environment Variables

Configure these in your Vercel project settings:

### Database
- `DATABASE_URL` - PostgreSQL connection string
- `DATABASE_AUTH_TOKEN` - Database authentication token (if required)

### Supabase
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_KEY` - Supabase service role key

### Redis (Optional, for caching/rate limiting)
- `UPSTASH_REDIS_REST_URL` - Upstash Redis REST URL
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis token

### CORS
- `ALLOWED_API_ORIGINS` - Comma-separated list of allowed origins (e.g., `https://yourdomain.com,https://www.yourdomain.com`)

### Email (Optional, for Resend)
- `RESEND_API_KEY` - Resend API key for sending emails

### Encryption
- `ENCRYPTION_KEY` - Key for encrypting sensitive data

## API Endpoints

Once deployed, your API will be available at:
- `https://your-project.vercel.app/` - API documentation (Scalar UI)
- `https://your-project.vercel.app/health` - Health check
- `https://your-project.vercel.app/trpc/*` - tRPC endpoints
- `https://your-project.vercel.app/openapi` - OpenAPI specification

## Updating Dashboard CORS

After deploying the API, update your dashboard's environment variable:

```
NEXT_PUBLIC_API_URL=https://your-api-project.vercel.app
```

And add your dashboard URL to the API's `ALLOWED_API_ORIGINS`:

```
ALLOWED_API_ORIGINS=https://your-dashboard.vercel.app
```

## Monitoring

- View logs in Vercel Dashboard > Your Project > Logs
- Monitor function invocations and performance metrics
- Set up alerts for errors and performance issues

## Troubleshooting

### Cold starts
Vercel serverless functions may experience cold starts. Consider:
- Upgrading to Pro plan for better cold start performance
- Using Vercel Edge Functions for latency-critical endpoints

### Function timeout
Default timeout is 10s on Hobby plan, 60s on Pro. If you need longer:
- Configure `maxDuration` in vercel.json
- Requires Pro or Enterprise plan

### Package size
Keep your deployment package under 50MB (uncompressed). Use:
```bash
vercel build --prod
```
to check build size.
