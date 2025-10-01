#!/bin/bash

# Setup script for Cloudflare Tunnel in Kubernetes
# This script will guide you through creating and configuring a Cloudflare tunnel

set -e

echo "========================================"
echo "Cloudflare Tunnel Setup for Kubernetes"
echo "========================================"
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "cloudflared CLI is not installed."
    echo "Please install it first:"
    echo "  macOS: brew install cloudflared"
    echo "  Linux: See https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation"
    exit 1
fi

# Check if user is logged in to Cloudflare
echo "Checking Cloudflare authentication..."
if ! cloudflared tunnel list &> /dev/null; then
    echo "You need to authenticate with Cloudflare first."
    echo "Running: cloudflared tunnel login"
    cloudflared tunnel login
fi

TUNNEL_NAME="workbooks-tunnel"

# Check if tunnel already exists
echo ""
echo "Checking if tunnel '$TUNNEL_NAME' exists..."
if cloudflared tunnel list | grep -q "$TUNNEL_NAME"; then
    echo "Tunnel '$TUNNEL_NAME' already exists."
    echo "Do you want to delete and recreate it? (y/n)"
    read -r response
    if [[ "$response" == "y" ]]; then
        echo "Deleting existing tunnel..."
        cloudflared tunnel delete "$TUNNEL_NAME" --force
        echo "Creating new tunnel..."
        cloudflared tunnel create "$TUNNEL_NAME"
    else
        echo "Using existing tunnel."
    fi
else
    echo "Creating new tunnel '$TUNNEL_NAME'..."
    cloudflared tunnel create "$TUNNEL_NAME"
fi

# Get tunnel ID
TUNNEL_ID=$(cloudflared tunnel list | grep "$TUNNEL_NAME" | awk '{print $1}')
echo ""
echo "Tunnel ID: $TUNNEL_ID"

# Find credentials file
CREDS_FILE="$HOME/.cloudflared/${TUNNEL_ID}.json"
if [ ! -f "$CREDS_FILE" ]; then
    echo "Error: Credentials file not found at $CREDS_FILE"
    exit 1
fi

echo "Found credentials file: $CREDS_FILE"

# Create base64 encoded credentials
echo ""
echo "Creating Kubernetes secret with tunnel credentials..."
CREDS_BASE64=$(cat "$CREDS_FILE" | base64)

# Create the secret YAML
cat > cloudflare-tunnel-secret.yaml <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: tunnel-credentials
  namespace: cloudflare
type: Opaque
data:
  credentials.json: $CREDS_BASE64
EOF

echo "Secret YAML created: cloudflare-tunnel-secret.yaml"

# Configure DNS routes in Cloudflare
echo ""
echo "========================================"
echo "DNS Configuration"
echo "========================================"
echo ""
echo "Now you need to create DNS routes for your tunnel."
echo "Run these commands to route your domains to the tunnel:"
echo ""
echo "  cloudflared tunnel route dns $TUNNEL_NAME workbooks.tocld.com"
echo "  cloudflared tunnel route dns $TUNNEL_NAME workbooks-api.tocld.com"
echo ""
echo "Or you can manually add CNAME records in Cloudflare Dashboard:"
echo "  workbooks.tocld.com     -> ${TUNNEL_ID}.cfargotunnel.com"
echo "  workbooks-api.tocld.com -> ${TUNNEL_ID}.cfargotunnel.com"
echo ""

# Apply to Kubernetes
echo "========================================"
echo "Applying to Kubernetes"
echo "========================================"
echo ""
echo "To deploy the tunnel to your Kubernetes cluster, run:"
echo ""
echo "  1. kubectl apply -f cloudflare-tunnel-secret.yaml"
echo "  2. kubectl apply -f cloudflare-tunnel-setup.yaml"
echo ""
echo "Then check the deployment status with:"
echo "  kubectl get pods -n cloudflare"
echo "  kubectl logs -n cloudflare -l app=cloudflared"
echo ""
echo "========================================"
echo "Setup complete!"
echo "========================================"