#!/bin/bash

# Production Build Script for website-3

echo "🚀 Starting Production Build..."

# Check if NODE_ENV is set
if [ -z "$NODE_ENV" ]; then
  export NODE_ENV=production
fi

# Check if NEXT_PUBLIC_ENV is set
if [ -z "$NEXT_PUBLIC_ENV" ]; then
  export NEXT_PUBLIC_ENV=production
fi

echo "📝 Environment: $NEXT_PUBLIC_ENV"
echo "🔧 Node Environment: $NODE_ENV"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Clean previous build
echo "🧹 Cleaning previous builds..."
rm -rf .next

# Build the application
echo "🔨 Building Next.js application..."
npm run build:production

if [ $? -eq 0 ]; then
  echo "✅ Build completed successfully!"
  echo "📊 Build output:"
  du -sh .next
else
  echo "❌ Build failed!"
  exit 1
fi
