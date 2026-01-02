#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Format TypeScript/JavaScript/JSON/CSS files with Prettier
echo "Formatting TypeScript/JavaScript/JSON/CSS files..."
cd "$PROJECT_ROOT/app/bouncer"
npx prettier --write "**/*.{ts,tsx,js,jsx,json,css,md}" || true

# Format Rust files with rustfmt
echo "Formatting Rust files..."
if command -v cargo &> /dev/null; then
  # Format each Rust project
  for rust_project in "$PROJECT_ROOT"/app/*/Cargo.toml; do
    if [ -f "$rust_project" ]; then
      project_dir="$(dirname "$rust_project")"
      echo "  Formatting $(basename "$project_dir")..."
      (cd "$project_dir" && cargo fmt --all || true)
    fi
  done
  # Also check research directories
  for rust_project in "$PROJECT_ROOT"/research/*/Cargo.toml; do
    if [ -f "$rust_project" ]; then
      project_dir="$(dirname "$rust_project")"
      echo "  Formatting $(basename "$project_dir")..."
      (cd "$project_dir" && cargo fmt --all || true)
    fi
  done
fi

echo "Formatting complete!"

