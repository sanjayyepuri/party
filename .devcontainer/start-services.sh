#!/bin/bash

# Start services script for party project
set -e

echo "🎉 Starting Party services..."

# Wait for database to be ready
echo "⏳ Waiting for database..."
until pg_isready -h localhost -p 5432 -U party_user; do
    echo "Database is unavailable - sleeping"
    sleep 1
done
echo "✅ Database is ready!"

# Start pregame gRPC server in background
echo "🦀 Starting pregame gRPC server..."
cd /workspaces/party/pregame
cargo build --release
./target/release/pregame &
PREGAME_PID=$!

# Wait for gRPC server to start
echo "⏳ Waiting for gRPC server to start..."
sleep 5

# Start bouncer frontend
echo "⚡ Starting bouncer frontend..."
cd /workspaces/party/bouncer
npm install
npm run build
npm start &
BOUNCER_PID=$!

echo "🚀 All services started!"
echo "📊 Frontend: http://localhost:3000"
echo "🔌 gRPC Server: localhost:50051"
echo "🗄️ Database: localhost:5432"

# Keep script running
wait $PREGAME_PID $BOUNCER_PID