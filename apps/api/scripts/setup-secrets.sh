#!/bin/bash

# Script to set Cloudflare Workers secrets from .env.local file
# Usage: ./scripts/setup-secrets.sh [--env production]

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Parse arguments
ENV_FLAG=""
if [ "$1" == "--env" ] && [ "$2" == "production" ]; then
  ENV_FLAG="--env production"
  echo -e "${YELLOW}Setting secrets for PRODUCTION environment${NC}"
else
  echo -e "${BLUE}Setting secrets for DEVELOPMENT environment${NC}"
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
  echo -e "${RED}Error: .env.local file not found${NC}"
  echo "Please create a .env.local file with your environment variables"
  exit 1
fi

echo -e "${GREEN}Reading environment variables from .env.local${NC}\n"

# Array of required secrets
SECRETS=(
  "DATABASE_URL"
  "SUPABASE_JWT_SECRET"
  "SUPABASE_SERVICE_KEY"
  "SUPABASE_URL"
  "RESEND_API_KEY"
  "DIRTWORKS_ENCRYPTION_KEY"
  "ALLOWED_API_ORIGINS"
  "INVOICE_JWT_SECRET"
  "REDIS_URL"
  "NEXT_PUBLIC_URL"
  "SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_KEY"
  "SUPABASE_JWT_SECRET"
)

# Optional secrets (will skip if not found)
OPTIONAL_SECRETS=(
  "OPENAI_API_KEY"
  "ENGINE_API_URL"
  "ENGINE_API_KEY"
  "TRIGGER_PROJECT_ID"
  "TRIGGER_SECRET_KEY"
  "POLAR_ACCESS_TOKEN"
  "GOOGLE_GENERATIVE_AI_API_KEY"
  "AI_GATEWAY_API_KEY"
)

# Function to set a secret
set_secret() {
  local key=$1
  local value=$2
  local is_optional=$3

  if [ -z "$value" ]; then
    if [ "$is_optional" == "true" ]; then
      echo -e "${YELLOW}⚠ Skipping optional secret: $key (not set in .env.local)${NC}"
      return 0
    else
      echo -e "${RED}✗ Error: Required secret $key is empty in .env.local${NC}"
      return 1
    fi
  fi

  echo -e "${BLUE}Setting secret: $key${NC}"
  echo "$value" | wrangler secret put "$key" $ENV_FLAG 2>&1 | grep -v "Enter a secret value"

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Successfully set $key${NC}\n"
  else
    echo -e "${RED}✗ Failed to set $key${NC}\n"
    return 1
  fi
}

# Load .env.local
export $(grep -v '^#' .env.local | xargs)

echo -e "${GREEN}Setting required secrets...${NC}\n"

# Set required secrets
for secret in "${SECRETS[@]}"; do
  value="${!secret}"
  set_secret "$secret" "$value" "false" || exit 1
done

echo -e "${GREEN}Setting optional secrets...${NC}\n"

# Set optional secrets
for secret in "${OPTIONAL_SECRETS[@]}"; do
  value="${!secret}"
  set_secret "$secret" "$value" "true" || true
done

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ All secrets set successfully!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${BLUE}Next steps:${NC}"
echo -e "1. Deploy your worker: ${YELLOW}bun run deploy${NC}"
if [ -z "$ENV_FLAG" ]; then
  echo -e "2. Or deploy to production: ${YELLOW}bun run deploy:production${NC}"
fi
echo -e "3. Test your API endpoint"
