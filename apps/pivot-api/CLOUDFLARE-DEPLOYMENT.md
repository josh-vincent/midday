# Cloudflare Deployment Guide

This API is configured to deploy to **Cloudflare Workers** for a unified deployment experience with the dashboard on Cloudflare Pages.

## Why Cloudflare?

- **Unified Platform**: Deploy both dashboard (Cloudflare Pages) and API (Cloudflare Workers) in one place
- **Hono-Native**: Hono was built specifically for Cloudflare Workers
- **Global Edge Network**: Fast API responses worldwide
- **Simple Scaling**: Auto-scales with zero configuration
- **Cost-Effective**: Generous free tier, pay-as-you-go pricing

## Prerequisites

1. **Cloudflare Account**: Sign up at https://dash.cloudflare.com
2. **Wrangler CLI**: Install globally
   ```bash
   npm install -g wrangler
   ```

## Setup

### 1. Login to Cloudflare

```bash
wrangler login
```

### 2. Set Environment Variables

Set your secrets (these are encrypted and not stored in wrangler.toml):

```bash
# Database
wrangler secret put DATABASE_URL

# Supabase
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_KEY

# Redis
wrangler secret put REDIS_URL

# Email
wrangler secret put RESEND_API_KEY

# Encryption
wrangler secret put ENCRYPTION_KEY

# API Origins (comma-separated)
wrangler secret put ALLOWED_API_ORIGINS
```

For production environment, add `--env production`:
```bash
wrangler secret put DATABASE_URL --env production
```

### 3. Deploy

**Development/Staging:**
```bash
bun run deploy
```

**Production:**
```bash
bun run deploy:production
```

## Local Development

Test with Cloudflare Workers locally:

```bash
bun run dev:wrangler
```

Or use the regular Bun dev server:

```bash
bun run dev
```

## Dashboard Configuration

After deploying, configure your Cloudflare Pages dashboard to use the API:

1. **Get your Worker URL**: After deployment, Wrangler will show your URL (e.g., `https://midday-api.your-subdomain.workers.dev`)

2. **Update Dashboard Environment Variables** in Cloudflare Pages:
   ```
   NEXT_PUBLIC_API_URL=https://midday-api.your-subdomain.workers.dev
   ```

3. **Update API CORS** - Add your dashboard URL to allowed origins:
   ```bash
   wrangler secret put ALLOWED_API_ORIGINS
   # Enter: https://your-dashboard.pages.dev,https://yourdomain.com
   ```

## Custom Domain

Add a custom domain to your Worker:

1. Go to Cloudflare Dashboard > Workers & Pages > Your Worker
2. Click "Settings" > "Triggers"
3. Add a custom domain (requires domain on Cloudflare)

## Monitoring

View logs and analytics:

```bash
wrangler tail
```

Or check the Cloudflare Dashboard for real-time metrics.

## Deployment Checklist

- [ ] Install wrangler CLI
- [ ] Login to Cloudflare
- [ ] Set all required secrets
- [ ] Deploy to production
- [ ] Update dashboard environment variables
- [ ] Test API endpoints
- [ ] Add custom domain (optional)
- [ ] Set up monitoring/alerts

## Cost Estimate

Cloudflare Workers free tier includes:
- 100,000 requests/day
- 10ms CPU time per request

For most MVPs, this is sufficient. Paid plans start at $5/month for 10M requests.

## Troubleshooting

### "Module not found" errors
- Ensure all workspace dependencies are properly referenced
- Check that imports use correct paths

### "CPU time exceeded"
- Optimize database queries
- Add caching layer
- Consider moving heavy operations to background jobs

### CORS errors
- Verify `ALLOWED_API_ORIGINS` includes your dashboard URL
- Check that CORS middleware is properly configured in `src/index.ts`
