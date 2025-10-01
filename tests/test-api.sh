#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_URL="http://localhost:3334/trpc"

echo -e "${BLUE}=== Testing tRPC API Endpoints ===${NC}\n"

# You'll need to get a valid token from your browser's localStorage or cookies
# For now, let's prompt for it
echo "Please provide your authentication token (you can get this from browser localStorage - key: sb-ulncfblvuijlgniydjju-auth-token):"
echo "Or from the Network tab in DevTools when logged in"
read -r AUTH_TOKEN

if [ -z "$AUTH_TOKEN" ]; then
    echo -e "${RED}No token provided. Exiting.${NC}"
    exit 1
fi

echo -e "\n${BLUE}1. Testing user.me endpoint (should work without team)${NC}"
curl -X POST "$API_URL/user.me" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{"0":{"json":null}}' \
  | python3 -m json.tool

echo -e "\n${BLUE}2. Testing user.invites endpoint (should work without team)${NC}"
curl -X POST "$API_URL/user.invites" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{"0":{"json":null}}' \
  | python3 -m json.tool

echo -e "\n${BLUE}3. Testing team.current endpoint (will fail if no team)${NC}"
curl -X POST "$API_URL/team.current" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{"0":{"json":null}}' \
  | python3 -m json.tool

echo -e "\n${BLUE}4. Testing invoice.list endpoint (requires team)${NC}"
curl -X POST "$API_URL/invoice.list" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{"0":{"json":{"limit":10}}}' \
  | python3 -m json.tool

echo -e "\n${BLUE}5. Testing customer.list endpoint (requires team)${NC}"
curl -X POST "$API_URL/customer.list" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{"0":{"json":{"limit":10}}}' \
  | python3 -m json.tool

echo -e "\n${GREEN}=== Test Complete ===${NC}"