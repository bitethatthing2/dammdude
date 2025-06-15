@echo off
echo 🐳 Docker Application Rebuild Script
echo ==================================

REM Clean up existing containers and images
echo 📦 Cleaning up existing containers...
docker-compose down --remove-orphans
docker system prune -f

REM Rebuild the application
echo 🔨 Rebuilding Docker image...
docker-compose build --no-cache

REM Start the application
echo 🚀 Starting the application...
docker-compose up -d

REM Show logs
echo 📋 Application logs:
docker-compose logs -f
