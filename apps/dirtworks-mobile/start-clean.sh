#!/bin/bash

# Mobile App Clean Startup Script
# This script cleans up all caches and starts the Expo app fresh

set -e

echo "🧹 Cleaning Expo mobile app..."

# Navigate to mobile app directory
cd "$(dirname "$0")"

echo "📍 Current directory: $(pwd)"

# Kill any running Expo/Metro processes
echo "🔪 Killing existing Expo/Metro processes..."
pkill -f "expo" || true
pkill -f "metro" || true
pkill -f "node.*8081" || true

# Kill processes on Expo ports
echo "🔌 Freeing up ports..."
lsof -ti:8081 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:8082 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:19000 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:19001 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:19002 2>/dev/null | xargs kill -9 2>/dev/null || true

# Clear caches
echo "🗑️  Removing cache directories..."
rm -rf .expo
rm -rf node_modules/.cache
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf /tmp/react-* 2>/dev/null || true

# Clear watchman if installed
if command -v watchman &> /dev/null; then
    echo "👁️  Clearing watchman..."
    watchman watch-del-all 2>/dev/null || true
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  Warning: .env.local not found!"
    echo "📝 Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env.local
        echo "✅ Created .env.local - please update with your actual values"
    else
        echo "❌ .env.example not found. Please create .env.local manually."
    fi
fi

# Verify dependencies are installed
if [ ! -d node_modules ]; then
    echo "📦 node_modules not found. Installing dependencies..."
    cd ../..
    bun install
    cd apps/dirtworks-mobile
fi

echo ""
echo "✨ Everything cleaned up!"
echo ""
echo "🚀 Starting Expo with cleared cache..."
echo ""

# Start expo with cleared cache
npx expo start --clear

# Alternative if expo is installed globally:
# expo start --clear
