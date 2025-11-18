#!/bin/bash

# Development startup script for party project
set -e

echo "🎉 Starting Party development environment..."

# Wait for database to be ready
echo "⏳ Waiting for database..."
until pg_isready -h localhost -p 5432 -U party_user; do
    echo "Database is unavailable - sleeping"
    sleep 1
done
echo "✅ Database is ready!"

# Start pregame gRPC server in development mode
echo "🦀 Starting pregame gRPC server (development)..."
cd /workspaces/party/pregame
cargo run &
PREGAME_PID=$!

# Wait for gRPC server to start
echo "⏳ Waiting for gRPC server to start..."
sleep 5

# Start bouncer frontend in development mode
echo "⚡ Starting bouncer frontend (development)..."
cd /workspaces/party/bouncer
npm install
NODE_ENV=development npm run dev &
BOUNCER_PID=$!

echo "🚀 Development environment ready!"
echo "📊 Frontend (dev): http://localhost:3000"
echo "🔌 gRPC Server: localhost:50051"
echo "🗄️ Database: localhost:5432"
echo ""
echo "💡 Use Ctrl+C to stop all services"

# Trap SIGINT and SIGTERM to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $PREGAME_PID $BOUNCER_PID 2>/dev/null || true
    wait $PREGAME_PID $BOUNCER_PID 2>/dev/null || true
    echo "✅ All services stopped"
}

trap cleanup SIGINT SIGTERM

# Keep script running
wait