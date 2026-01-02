#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Lint TypeScript/JavaScript files with ESLint
echo "Linting TypeScript/JavaScript files..."
cd "$PROJECT_ROOT/app/bouncer"
npx eslint . --fix || true

echo "Linting complete!"

