# Development Setup

## Using DevContainer (Recommended)

This project includes a complete DevContainer setup with PostgreSQL database.

1. Open the project in VS Code
2. Install the "Dev Containers" extension if not already installed
3. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) and select "Dev Containers: Reopen in Container"
4. Wait for the container to build and dependencies to install

### What's Included

- **Rust toolchain** with cargo
- **Node.js 18+** with yarn
- **PostgreSQL 14** with initialized `party` database
- **Protocol Buffers** compiler (protoc)
- **VS Code extensions**: Rust Analyzer, Tailwind CSS, TypeScript, Prettier

### Ports

- `5432`: PostgreSQL database
- `3000`: Next.js frontend (bouncer)
- `50051`: gRPC server (pregame)

### Database Connection

The PostgreSQL database is automatically configured with:
- Database: `party`
- Username: `postgres`
- Password: `password`
- Host: `localhost`
- Port: `5432`

Connection string: `postgres://postgres:password@localhost/party`

## Manual Setup (Alternative)

If you prefer not to use DevContainer:

1. Install Rust, Node.js, and PostgreSQL locally
2. Create a PostgreSQL database named `party`
3. Run the SQL script in `.devcontainer/init-db.sql`
4. Install dependencies:
   ```bash
   cd bouncer && yarn install
   cd ../pregame && cargo build
   ```

## Running the Application

### Backend (pregame)
```bash
cd pregame
cargo run
```

### Frontend (bouncer)
```bash
cd bouncer
yarn dev
```