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

# Check for uncommitted changes before formatting
cd "$PROJECT_ROOT"
UNCOMMITTED_BEFORE=$(git diff --name-only)

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

# Check if formatting changed any files
cd "$PROJECT_ROOT"
UNCOMMITTED_AFTER=$(git diff --name-only)
FORMATTED_FILES=$(git diff --name-only)

if [ -n "$FORMATTED_FILES" ]; then
  echo "Error: The following files were reformatted and need to be staged:"
  echo "$FORMATTED_FILES"
  echo ""
  echo "Please run 'git add' on these files and commit again."
  exit 1
fi

echo "Pre-commit checks passed!"

