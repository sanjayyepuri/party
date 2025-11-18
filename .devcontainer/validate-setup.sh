#!/bin/bash

# Validation script for party devcontainer setup
echo "🔍 Validating Party devcontainer setup..."

# Check if all required files exist
echo "📁 Checking required files..."

required_files=(
    ".devcontainer/devcontainer.json"
    ".devcontainer/docker-compose.yml"
    ".devcontainer/start-dev.sh"
    ".devcontainer/start-services.sh"
    ".devcontainer/init-db.sql"
    "pregame/Cargo.toml"
    "bouncer/package.json"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - MISSING"
    fi
done

# Check if scripts are executable
echo ""
echo "🔧 Checking script permissions..."
if [ -x ".devcontainer/start-dev.sh" ]; then
    echo "✅ start-dev.sh is executable"
else
    echo "❌ start-dev.sh is not executable"
fi

if [ -x ".devcontainer/start-services.sh" ]; then
    echo "✅ start-services.sh is executable"
else
    echo "❌ start-services.sh is not executable"
fi

# Check Rust project
echo ""
echo "🦀 Checking Rust project..."
cd pregame
if cargo check --quiet; then
    echo "✅ Pregame Rust project compiles"
else
    echo "❌ Pregame Rust project has compilation errors"
fi
cd ..

# Check Node.js project
echo ""
echo "⚡ Checking Node.js project..."
cd bouncer
if npm list --depth=0 --silent 2>/dev/null; then
    echo "✅ Bouncer Node.js dependencies installed"
else
    echo "❌ Bouncer Node.js dependencies missing - run 'npm install'"
fi

if npm run build --silent; then
    echo "✅ Bouncer Next.js project builds successfully"
else
    echo "❌ Bouncer Next.js project has build errors"
fi
cd ..

echo ""
echo "🎉 Validation complete!"
echo ""
echo "📖 Usage:"
echo "  Development: ./.devcontainer/start-dev.sh"
echo "  Production:  ./.devcontainer/start-services.sh"