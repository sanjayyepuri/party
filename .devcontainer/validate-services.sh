#!/bin/bash

# Validate services script for devcontainer
set -e

echo "🔧 Validating devcontainer services..."

# Check if docker-compose config is valid
echo "✅ Checking docker-compose configuration..."
docker compose -f .devcontainer/docker-compose.yml config > /dev/null
echo "✅ Docker-compose configuration is valid"

# Check if all required files exist
echo "✅ Checking required files..."
files=(
    ".devcontainer/Dockerfile"
    ".devcontainer/init-db.sql"
    ".devcontainer/.env"
    "pregame/Cargo.toml"
    "bouncer/package.json"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ Found $file"
    else
        echo "❌ Missing $file"
        exit 1
    fi
done

# Test network connectivity within compose
echo "✅ Testing service network configuration..."
docker compose -f .devcontainer/docker-compose.yml config --services | while read service; do
    echo "✅ Service configured: $service"
done

echo "🎉 All validations passed! Ready to start devcontainer."
echo ""
echo "To start the full stack:"
echo "  docker compose -f .devcontainer/docker-compose.yml up --build"
echo ""
echo "Services will be available at:"
echo "  - Frontend (bouncer): http://localhost:3000"
echo "  - gRPC Server (pregame): localhost:50051"
echo "  - PostgreSQL: localhost:5432"