#!/bin/bash

# Production start script for Railway

echo "Starting production server..."

# Run database migrations
echo "Running database migrations..."
pnpm db:push

# Start the server
echo "Starting server..."
NODE_ENV=production node server/_core/index.ts
