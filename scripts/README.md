# Formatting and Linting Scripts

This directory contains custom scripts for formatting and linting code.

## Scripts

- `format.sh` - Formats all TypeScript/JavaScript/JSON/CSS files with Prettier and Rust files with rustfmt
- `lint.sh` - Lints TypeScript/JavaScript files with ESLint
- `pre-commit.sh` - Runs all formatting and linting checks (use this as a git pre-commit hook)
- `vercel-local.sh` - Runs this repo with a local Vercel CLI checkout, defaulting to `../vercel`

## Usage

### Format all code
```bash
./scripts/format.sh
```

Or from the bouncer directory:
```bash
npm run format
```

### Lint code
```bash
./scripts/lint.sh
```

Or from the bouncer directory:
```bash
npm run lint:fix
```

### Run pre-commit checks
```bash
./scripts/pre-commit.sh
```

Or from the bouncer directory:
```bash
npm run pre-commit
```

### Run the local Vercel CLI checkout
```bash
./scripts/vercel-local.sh dev --debug --listen 3100
```

By default, this expects the Vercel repo at `../vercel` relative to this repo.
Override that location when needed:

```bash
VERCEL_CLI_REPO=/path/to/vercel ./scripts/vercel-local.sh dev
```

On macOS, the helper also detects Homebrew `openssl@3` and exports `OPENSSL_DIR`
and `PKG_CONFIG_PATH` for Rust builds. Install it with:

```bash
brew install openssl@3
```

## Setting up Git Pre-commit Hook

To automatically run formatting and linting before each commit, install the pre-commit hook:

```bash
ln -s ../../scripts/pre-commit.sh .git/hooks/pre-commit
```

Or manually copy:
```bash
cp scripts/pre-commit.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```



