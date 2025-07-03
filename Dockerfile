# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY backend/requirements.txt /app/requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ /app/

# Create non-root user
RUN useradd -m -u 1000 nutrivize && chown -R nutrivize:nutrivize /app
USER nutrivize

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=120s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Start the application
CMD ["gunicorn", "app.main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000", "--timeout", "120", "--worker-timeout", "120", "--keep-alive", "2", "--max-requests", "1000", "--max-requests-jitter", "50"]
