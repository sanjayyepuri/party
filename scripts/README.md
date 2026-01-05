# Formatting and Linting Scripts

This directory contains custom scripts for formatting and linting code.

## Scripts

- `format.sh` - Formats all TypeScript/JavaScript/JSON/CSS files with Prettier and Rust files with rustfmt
- `lint.sh` - Lints TypeScript/JavaScript files with ESLint
- `pre-commit.sh` - Runs all formatting and linting checks (use this as a git pre-commit hook)

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




