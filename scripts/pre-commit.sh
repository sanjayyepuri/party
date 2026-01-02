#!/bin/bash
set -e

# Pre-commit hook script
# This can be manually installed as a git hook or run directly

# Detect if we're running from .git/hooks or from scripts/
if [[ -f "${BASH_SOURCE[0]}" ]]; then
  SCRIPT_PATH="${BASH_SOURCE[0]}"
else
  SCRIPT_PATH="$0"
fi

SCRIPT_DIR="$(cd "$(dirname "$SCRIPT_PATH")" && pwd)"

# If script is in .git/hooks, go up two levels to project root
# Otherwise, go up one level from scripts/
if [[ "$(basename "$SCRIPT_DIR")" == "hooks" && "$(basename "$(dirname "$SCRIPT_DIR")")" == ".git" ]]; then
  PROJECT_ROOT="$(cd "$(dirname "$(dirname "$SCRIPT_DIR")")" && pwd)"
else
  PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
fi

echo "Running pre-commit checks..."

# Format and lint TypeScript/JavaScript files
cd "$PROJECT_ROOT/app/bouncer"
echo "Formatting TypeScript/JavaScript files..."
npx prettier --write "**/*.{ts,tsx,js,jsx,json,css,md}" || {
  echo "Prettier formatting failed"
  exit 1
}

echo "Linting TypeScript/JavaScript files..."
npx eslint . --fix || {
  echo "Warning: ESLint found issues (non-blocking)"
}

# Format Rust files
if command -v cargo &> /dev/null; then
  echo "Formatting Rust files..."
  # Format each Rust project
  for rust_project in "$PROJECT_ROOT"/app/*/Cargo.toml; do
    if [ -f "$rust_project" ]; then
      project_dir="$(dirname "$rust_project")"
      (cd "$project_dir" && cargo fmt --all || true)
    fi
  done
  # Also check research directories
  for rust_project in "$PROJECT_ROOT"/research/*/Cargo.toml; do
    if [ -f "$rust_project" ]; then
      project_dir="$(dirname "$rust_project")"
      (cd "$project_dir" && cargo fmt --all || true)
    fi
  done
fi

echo "Pre-commit checks passed!"

