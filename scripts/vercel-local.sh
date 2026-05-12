#!/bin/bash

set -euo pipefail

PARTY_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERCEL_CLI_REPO="${VERCEL_CLI_REPO:-"$PARTY_ROOT/../vercel"}"
VERCEL_CLI_PACKAGE="$VERCEL_CLI_REPO/packages/cli"

if [ ! -d "$VERCEL_CLI_PACKAGE" ]; then
  echo "Local Vercel CLI checkout not found at: $VERCEL_CLI_PACKAGE" >&2
  echo "Set VERCEL_CLI_REPO=/path/to/vercel or clone it next to party:" >&2
  echo "  git clone https://github.com/vercel/vercel.git \"$PARTY_ROOT/../vercel\"" >&2
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required to run the local Vercel CLI checkout." >&2
  echo "Install the repo-pinned version with: npm install -g pnpm@8.3.1" >&2
  exit 1
fi

if [ -z "${OPENSSL_DIR:-}" ] && command -v brew >/dev/null 2>&1; then
  if OPENSSL_PREFIX="$(brew --prefix openssl@3 2>/dev/null)" && [ -d "$OPENSSL_PREFIX" ]; then
    export OPENSSL_DIR="$OPENSSL_PREFIX"
    if [ -d "$OPENSSL_PREFIX/lib/pkgconfig" ]; then
      export PKG_CONFIG_PATH="$OPENSSL_PREFIX/lib/pkgconfig${PKG_CONFIG_PATH:+:$PKG_CONFIG_PATH}"
    fi
  fi
fi

cd "$VERCEL_CLI_PACKAGE"
exec pnpm vercel --cwd "$PARTY_ROOT" "$@"
