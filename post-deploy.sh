#!/usr/bin/env bash
set -e

echo "=== Starting web app deployment ==="

APP_DIR="/root/projects/betsweb"
BUILD_DIR="/var/www/html"

cd "$APP_DIR"

echo "Installing dependencies..."
npm install

echo "Building the application into $BUILD_DIR..."
npm run --configuration production build -- --output-path="$BUILD_DIR"
echo "Build completed."

echo "=== Deployment finished successfully ==="
