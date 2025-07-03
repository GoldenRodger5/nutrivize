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

# Ensure we're in the right directory
if [[ ! -f "backend/app/main.py" ]] || [[ ! -f "frontend/package.json" ]]; then
    echo "❌ Error: This script must be run from the nutrivize-v2 root directory"
    echo "Current directory: $(pwd)"
    echo "Please cd to the nutrivize-v2 directory and run: ./start-nutrivize.sh"
    exit 1
fi

# Check if required dependencies exist
echo "🔍 Checking dependencies..."

# Check if backend dependencies are installed
if [[ ! -f "backend/requirements.txt" ]]; then
    echo "❌ Backend requirements.txt not found"
    exit 1
fi

# Check if frontend dependencies are installed
if [[ ! -d "frontend/node_modules" ]]; then
    echo "⚠️  Frontend node_modules not found. Installing dependencies..."
    cd frontend && npm install && cd ..
    if [[ $? -ne 0 ]]; then
        echo "❌ Failed to install frontend dependencies"
        exit 1
    fi
fi

# Check if Python virtual environment is activated
if [[ -z "$VIRTUAL_ENV" ]] && [[ -z "$CONDA_DEFAULT_ENV" ]]; then
    echo "⚠️  No Python virtual environment detected"
    echo "💡 Tip: Activate your conda environment with: conda activate <env-name>"
    echo "📝 Or activate your venv with: source venv/bin/activate"
    echo ""
    echo "Continuing anyway..."
fi

# Check and clear ports
echo "🔍 Checking ports..."
check_and_kill_port 8000  # Backend FastAPI
check_and_kill_port 5173  # Frontend Vite

# Wait for ports to be actually free
wait_for_port_free 8000
wait_for_port_free 5173

echo ""
echo "📦 Starting Backend (FastAPI) on port 8000..."
cd backend

# Check if we can import the main app
if ! python -c "from app.main import app" 2>/dev/null; then
    echo "❌ Failed to import backend app. Check your Python environment and dependencies."
    exit 1
fi

# Start backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Give backend time to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend is actually running
if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "⚠️  Backend might not be fully ready yet, but starting frontend..."
else
    echo "✅ Backend is responding"
fi

echo ""
echo "🎨 Starting Frontend (React + Vite) on port 5173..."
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..

# Give frontend time to start
echo "⏳ Waiting for frontend to start..."
sleep 3

echo ""
echo "🎉 Nutrivize V2 Development Environment Started!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Backend API:  http://localhost:8000"
echo "🌐 Frontend App: http://localhost:5173"
echo "📊 API Docs:     http://localhost:8000/docs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Process IDs:"
echo "   Backend PID:  $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "🛑 To stop both servers, press Ctrl+C"
echo ""

# Improved cleanup function
cleanup() {
    echo ""
    echo "🛑 Shutting down Nutrivize V2 servers..."
    
    # Kill processes more gracefully
    if [ ! -z "$BACKEND_PID" ]; then
        if kill -0 $BACKEND_PID 2>/dev/null; then
            echo "📦 Stopping backend (PID: $BACKEND_PID)..."
            kill $BACKEND_PID 2>/dev/null
        fi
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            echo "🎨 Stopping frontend (PID: $FRONTEND_PID)..."
            kill $FRONTEND_PID 2>/dev/null
        fi
    fi
    
    # Force kill any remaining processes on our ports after a grace period
    sleep 3
    echo "🧹 Cleaning up any remaining processes..."
    check_and_kill_port 8000
    check_and_kill_port 5173
    
    echo ""
    echo "✅ Nutrivize V2 servers stopped successfully"
    echo "👋 Thanks for using Nutrivize V2!"
    exit 0
}

# Set up signal handling for graceful shutdown
trap cleanup INT TERM

# Wait for user interrupt (Ctrl+C)
wait
