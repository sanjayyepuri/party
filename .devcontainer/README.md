# Party Development Environment

This devcontainer provides a complete full-stack development environment for the Party project.

## Services

- **Database**: PostgreSQL 14.1 on port 5432
- **Pregame**: Rust gRPC server on port 50051
- **Bouncer**: Next.js frontend on port 3000

## Quick Start

### Development Mode (Recommended)
```bash
./.devcontainer/start-dev.sh
```

This starts all services in development mode with hot reloading.

### Production Mode
```bash
./.devcontainer/start-services.sh
```

This builds and runs optimized production versions.

## Manual Service Management

### Start Database Only
```bash
docker-compose up db -d
```

### Start Individual Services

**Pregame (gRPC Server):**
```bash
cd pregame
cargo run
```

**Bouncer (Frontend):**
```bash
cd bouncer
npm run dev  # Development mode
npm run build && npm start  # Production mode
```

## Environment Configuration

- **Development**: Uses `.env.development` with mock API fallback
- **Production**: Uses `.env.production` with real API integration
- Set `NEXT_PUBLIC_USE_REAL_API=true` to force real API usage in development

## API Endpoints

- Frontend: http://localhost:3000
- gRPC Server: localhost:50051
- Database: localhost:5432

## Troubleshooting

1. **Database connection issues**: Ensure PostgreSQL is running and accessible on port 5432
2. **gRPC server not responding**: Check that pregame service started successfully
3. **Frontend build errors**: Verify all npm dependencies are installed
4. **Port conflicts**: Make sure ports 3000, 5432, and 50051 are available

## Testing

Run comprehensive tests:
```bash
cd pregame
cargo test
```

The test suite includes 71+ unit tests covering all CRUD operations.