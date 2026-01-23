#!/usr/bin/env bash
set -e

APP_DIR="/root/projects/betsweb"
BUILD_DIR="/var/www/html"

# Add npm to PATH
export PATH=$PATH:/root/.nvm/versions/node/v20.20.0/bin

cd "$APP_DIR"

echo "📦 Installing dependencies..."
npm install

echo "🏗️ Building the application into $BUILD_DIR..."
npm run build -- --output-path="$BUILD_DIR"
echo "✅ Build completed."