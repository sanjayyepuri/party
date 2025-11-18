# Party

I was bored and decided that I wanted to partiful clone. That way I can create more bespoke invitations to events I host.

There are two main components:
* **pregame** - the API server (Rust/gRPC) that handles requests to manage the party
* **bouncer** - the main frontend (Next.js) used by guests to manage their invitations

All data will be stored in a PostgreSQL database.

## Quick Start with Docker Compose

This project uses Docker Compose to orchestrate all services automatically. All you need is Docker (with Compose V2).

### Prerequisites
- [Docker Desktop](https://www.docker.com/get-started) installed and running

### Launch the Project

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd party
   ```

2. **Start all services**:
   ```bash
   docker compose -f .devcontainer/docker-compose.yml up -d
   ```

3. **Wait for services to start**:
   - Docker will build the containers (first time takes 3-5 minutes)
   - Dependencies will install automatically
   - All services will start and run in the background

4. **Access the application**:
   - **Frontend**: Open http://localhost:3000 in your browser
   - **Backend gRPC**: Available at localhost:50051
   - **Database**: PostgreSQL at localhost:5432

### Using with DevContainers (Optional)

If your editor supports DevContainers (VS Code, Cursor, etc.):

1. Open the project in your editor
2. When prompted, select "Reopen in Container" or similar option
3. All services start automatically within the container environment

For VS Code/Cursor users, install the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

### What Happens Automatically

Docker Compose orchestrates 4 services:

1. **db** - PostgreSQL database with initialized schema
2. **pregame** - Rust backend that builds and runs the gRPC server
3. **bouncer** - Next.js frontend that installs deps and starts dev server
4. **app** - Development workspace container with all tools installed (Rust, Node.js, protoc)

All services communicate over a private Docker network and are configured to work together.

### Viewing Service Logs

To see logs from any service:

```bash
# View all service logs
docker compose -f .devcontainer/docker-compose.yml logs

# View specific service logs
docker compose -f .devcontainer/docker-compose.yml logs pregame
docker compose -f .devcontainer/docker-compose.yml logs bouncer
docker compose -f .devcontainer/docker-compose.yml logs db

# Follow logs in real-time
docker compose -f .devcontainer/docker-compose.yml logs -f bouncer
```

### Restarting Services

If you need to restart a service:

```bash
# Restart the backend
docker compose -f .devcontainer/docker-compose.yml restart pregame

# Restart the frontend
docker compose -f .devcontainer/docker-compose.yml restart bouncer

# Restart all services
docker compose -f .devcontainer/docker-compose.yml restart
```

### Rebuilding Services

If you make changes to dependencies (Cargo.toml, package.json) or Dockerfiles:

```bash
# Rebuild and restart all services
docker compose -f .devcontainer/docker-compose.yml up --build -d

# Rebuild specific service
docker compose -f .devcontainer/docker-compose.yml up --build -d pregame
```

If using DevContainers in your editor, you can also use your editor's rebuild command (e.g., "Rebuild Container" in VS Code).

## Project Structure
```
party/
├── bouncer/          # Next.js frontend (port 3000)
│   ├── app/          # Next.js app directory
│   ├── lib/          # Utility functions
│   └── proto/        # gRPC client definitions
├── pregame/          # Rust backend (port 50051)
│   ├── src/          # Source code
│   ├── proto/        # gRPC service definitions
│   └── migrations/   # Database migrations
└── .devcontainer/    # DevContainer & Docker Compose config
    ├── docker-compose.yml
    ├── Dockerfile
    └── init-db.sql
```

## Ports & Services

| Service | Port | Description |
|---------|------|-------------|
| bouncer | 3000 | Next.js frontend application |
| pregame | 50051 | gRPC API server |
| db | 5432 | PostgreSQL database |

## Database Connection

The PostgreSQL database is automatically initialized with:
- **Database**: `party`
- **Username**: `postgres`
- **Password**: `password`
- **Host**: `db` (within Docker network) or `localhost` (from host machine)
- **Connection string**: `postgres://postgres:password@db/party`

## Development Workflow

1. Start services with `docker compose -f .devcontainer/docker-compose.yml up -d`
2. Open project in your editor (Zed, VS Code, Cursor, etc.)
3. Make code changes
4. Services auto-reload on file changes:
   - Frontend (bouncer): Hot reload via Next.js
   - Backend (pregame): Rebuild with `cargo build` and restart service
5. View logs to debug issues
6. Database persists data in Docker volume

### Stopping Services

```bash
# Stop all services
docker compose -f .devcontainer/docker-compose.yml down

# Stop but keep data
docker compose -f .devcontainer/docker-compose.yml stop
```

## Troubleshooting

**Services not starting?**
- Check Docker Desktop is running
- View logs: `docker compose -f .devcontainer/docker-compose.yml logs`
- Rebuild containers: `docker compose -f .devcontainer/docker-compose.yml up --build -d`

**Port already in use?**
- Stop other services using ports 3000, 5432, or 50051
- Or modify ports in `.devcontainer/docker-compose.yml`

**Frontend not loading?**
- Check bouncer logs: `docker compose -f .devcontainer/docker-compose.yml logs bouncer`
- Verify service is running: `docker compose -f .devcontainer/docker-compose.yml ps`

**Database connection errors?**
- Verify db service is running: `docker compose -f .devcontainer/docker-compose.yml ps`
- Check connection string in pregame/.env

**Want to reset everything?**
```bash
# Stop and remove all containers, networks, and volumes
docker compose -f .devcontainer/docker-compose.yml down -v
# Then restart
docker compose -f .devcontainer/docker-compose.yml up -d
```

## Additional Documentation

- [DEVELOPMENT.md](DEVELOPMENT.md) - Detailed development setup
- [GRPC_SERVER_STATUS.md](GRPC_SERVER_STATUS.md) - gRPC server implementation details
