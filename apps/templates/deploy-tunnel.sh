#!/bin/bash

# Automated Cloudflare Tunnel Deployment Script
# This script will set up the tunnel and deploy it to Kubernetes

set -e

echo "========================================"
echo "Automated Cloudflare Tunnel Deployment"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
print_info() { echo -e "ℹ $1"; }

# Check prerequisites
print_info "Checking prerequisites..."

if ! command -v cloudflared &> /dev/null; then
    print_error "cloudflared is not installed. Please install it first."
    exit 1
fi
print_success "cloudflared is installed"

if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed."
    exit 1
fi
print_success "kubectl is installed"

# Check Kubernetes connectivity
if ! kubectl cluster-info &> /dev/null; then
    print_error "Cannot connect to Kubernetes cluster"
    exit 1
fi
print_success "Connected to Kubernetes cluster"

# Check if services exist
if ! kubectl get svc workbooks-api -n default &> /dev/null; then
    print_error "Service workbooks-api not found in default namespace"
    exit 1
fi
print_success "Found workbooks-api service"

if ! kubectl get svc workbooks-dashboard -n default &> /dev/null; then
    print_error "Service workbooks-dashboard not found in default namespace"
    exit 1
fi
print_success "Found workbooks-dashboard service"

echo ""
print_info "All prerequisites met!"
echo ""

# Tunnel configuration
TUNNEL_NAME="workbooks-tunnel"

# Check authentication
print_info "Checking Cloudflare authentication..."
if ! cloudflared tunnel list &> /dev/null; then
    print_warning "Not authenticated with Cloudflare. Please log in:"
    cloudflared tunnel login
    echo ""
fi
print_success "Authenticated with Cloudflare"

# Check for existing tunnel
echo ""
print_info "Checking for existing tunnel '$TUNNEL_NAME'..."
EXISTING_TUNNEL=$(cloudflared tunnel list | grep "$TUNNEL_NAME" || true)

if [ -n "$EXISTING_TUNNEL" ]; then
    print_warning "Tunnel '$TUNNEL_NAME' already exists"
    TUNNEL_ID=$(echo "$EXISTING_TUNNEL" | awk '{print $1}')
    print_info "Tunnel ID: $TUNNEL_ID"
else
    print_info "Creating new tunnel '$TUNNEL_NAME'..."
    if cloudflared tunnel create "$TUNNEL_NAME"; then
        print_success "Tunnel created successfully"
        TUNNEL_ID=$(cloudflared tunnel list | grep "$TUNNEL_NAME" | awk '{print $1}')
        print_info "Tunnel ID: $TUNNEL_ID"
    else
        print_error "Failed to create tunnel"
        exit 1
    fi
fi

# Find credentials file
CREDS_FILE="$HOME/.cloudflared/${TUNNEL_ID}.json"
if [ ! -f "$CREDS_FILE" ]; then
    print_error "Credentials file not found at: $CREDS_FILE"
    exit 1
fi
print_success "Found credentials file"

# Create namespace
echo ""
print_info "Creating cloudflare namespace..."
kubectl create namespace cloudflare 2>/dev/null || print_warning "Namespace already exists"

# Create secret from credentials file
echo ""
print_info "Creating Kubernetes secret with tunnel credentials..."
kubectl create secret generic tunnel-credentials \
    --from-file=credentials.json="$CREDS_FILE" \
    -n cloudflare \
    --dry-run=client -o yaml | kubectl apply -f -
print_success "Secret created/updated"

# Apply the tunnel configuration
echo ""
print_info "Applying tunnel configuration..."
if kubectl apply -f cloudflare-tunnel-quickstart.yaml; then
    print_success "Configuration applied successfully"
else
    print_error "Failed to apply configuration"
    exit 1
fi

# Wait for deployment to be ready
echo ""
print_info "Waiting for tunnel deployment to be ready..."
kubectl rollout status deployment/cloudflared -n cloudflare --timeout=60s || {
    print_warning "Deployment not ready yet. Checking pod status..."
    kubectl get pods -n cloudflare
}

# Configure DNS routes
echo ""
echo "========================================"
echo "DNS Configuration"
echo "========================================"
print_info "Setting up DNS routes in Cloudflare..."
echo ""

# Route workbooks.tocld.com
print_info "Routing workbooks.tocld.com to tunnel..."
if cloudflared tunnel route dns "$TUNNEL_NAME" workbooks.tocld.com 2>/dev/null; then
    print_success "Successfully routed workbooks.tocld.com"
else
    print_warning "workbooks.tocld.com might already be routed or there was an error"
fi

# Route workbooks-api.tocld.com
print_info "Routing workbooks-api.tocld.com to tunnel..."
if cloudflared tunnel route dns "$TUNNEL_NAME" workbooks-api.tocld.com 2>/dev/null; then
    print_success "Successfully routed workbooks-api.tocld.com"
else
    print_warning "workbooks-api.tocld.com might already be routed or there was an error"
fi

# Check deployment status
echo ""
echo "========================================"
echo "Deployment Status"
echo "========================================"
print_info "Checking deployment status..."
echo ""

kubectl get pods -n cloudflare
echo ""

# Get logs from first pod
POD_NAME=$(kubectl get pods -n cloudflare -l app=cloudflared -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
if [ -n "$POD_NAME" ]; then
    print_info "Recent logs from $POD_NAME:"
    kubectl logs -n cloudflare "$POD_NAME" --tail=20
fi

# Test connectivity
echo ""
echo "========================================"
echo "Testing Connectivity"
echo "========================================"
echo ""

print_info "Testing service endpoints..."
echo ""

# Function to test endpoint
test_endpoint() {
    local url=$1
    local service=$2
    
    print_info "Testing $service at $url"
    
    # Use curl with timeout
    if curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$url" | grep -q "^[23]"; then
        print_success "$service is accessible!"
    else
        print_warning "$service returned non-2xx/3xx status or timed out"
        print_info "This might be normal if the service requires authentication"
    fi
}

# Wait a moment for DNS propagation
print_info "Waiting 10 seconds for DNS propagation..."
sleep 10

# Test endpoints
test_endpoint "https://workbooks.tocld.com" "Dashboard"
test_endpoint "https://workbooks-api.tocld.com/health" "API"

echo ""
echo "========================================"
echo "Deployment Complete!"
echo "========================================"
echo ""
print_success "Cloudflare tunnel has been deployed successfully!"
echo ""
echo "Your services should now be accessible at:"
echo "  • Dashboard: https://workbooks.tocld.com"
echo "  • API: https://workbooks-api.tocld.com"
echo ""
echo "Useful commands:"
echo "  • Check pod status: kubectl get pods -n cloudflare"
echo "  • View logs: kubectl logs -n cloudflare -l app=cloudflared"
echo "  • Check tunnel status: cloudflared tunnel info $TUNNEL_NAME"
echo "  • Delete tunnel: kubectl delete -f cloudflare-tunnel-quickstart.yaml"
echo ""

# Show warning if pods are not ready
if ! kubectl get pods -n cloudflare | grep -q "Running"; then
    print_warning "Some pods are not in Running state. Please check the logs for issues."
fi