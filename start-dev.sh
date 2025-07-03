#!/bin/bash

# Nutrivize V2 Development Startup Script
echo "🚀 Starting Nutrivize V2 Development Environment..."

# Function to check if port is in use and kill process
check_and_kill_port() {
    local port=$1
    local pids=$(lsof -ti :$port 2>/dev/null)
    
    if [ ! -z "$pids" ]; then
        echo "⚠️  Port $port is already in use. Killing existing processes..."
        echo "$pids" | xargs kill -9 2>/dev/null
        sleep 3
        
        # Double check if port is still in use
        local remaining_pids=$(lsof -ti :$port 2>/dev/null)
        if [ ! -z "$remaining_pids" ]; then
            echo "🔄 Force killing remaining processes on port $port..."
            echo "$remaining_pids" | xargs kill -9 2>/dev/null
            sleep 2
        fi
        echo "✅ Port $port is now free"
    fi
}

# Function to wait for port to be available
wait_for_port_free() {
    local port=$1
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo "✅ Port $port is available"
            return 0
        fi
        echo "⏳ Waiting for port $port to be available (attempt $attempt/$max_attempts)..."
        sleep 2
        ((attempt++))
    done
    
    echo "❌ Port $port is still not available after $max_attempts attempts"
    return 1
}

# Check and clear ports
echo "🔍 Checking ports..."
check_and_kill_port 8000  # Backend
check_and_kill_port 5173  # Frontend

# Wait for ports to be actually free
wait_for_port_free 8000
wait_for_port_free 5173

echo "📦 Starting Backend (FastAPI)..."
cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Give backend time to start
sleep 3

echo "🎨 Starting Frontend (React + Vite)..."
cd frontend && npm run dev &
FRONTEND_PID=$!

# Give frontend time to start
sleep 2

echo ""
echo "✅ Development servers started!"
echo "🔧 Backend API: http://localhost:8000"
echo "🌐 Frontend App: http://localhost:5173"
echo ""
echo "📋 Backend PID: $BACKEND_PID"
echo "📋 Frontend PID: $FRONTEND_PID"
echo ""
echo "To stop both servers, press Ctrl+C"

# Improved cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    
    # Kill processes more gracefully
    if [ ! -z "$BACKEND_PID" ]; then
        if kill -0 $BACKEND_PID 2>/dev/null; then
            echo "Stopping backend (PID: $BACKEND_PID)..."
            kill $BACKEND_PID 2>/dev/null
        fi
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            echo "Stopping frontend (PID: $FRONTEND_PID)..."
            kill $FRONTEND_PID 2>/dev/null
        fi
    fi
    
    # Force kill any remaining processes on our ports
    sleep 2
    check_and_kill_port 8000
    check_and_kill_port 5173
    
    echo "✅ All servers stopped"
    exit 0
}

# Wait for user interrupt
trap cleanup INT TERM
wait
