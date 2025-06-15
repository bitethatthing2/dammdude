#!/bin/bash

echo "🐳 Docker Application Rebuild Script"
echo "=================================="

# Clean up existing containers and images
echo "📦 Cleaning up existing containers..."
docker-compose down --remove-orphans
docker system prune -f

# Rebuild the application
echo "🔨 Rebuilding Docker image..."
docker-compose build --no-cache

# Start the application
echo "🚀 Starting the application..."
docker-compose up -d

# Show logs
echo "📋 Application logs:"
docker-compose logs -f
