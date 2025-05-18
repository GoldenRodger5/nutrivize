"""
Uvicorn configuration with increased timeout settings
"""

# Timeout configurations
timeout_keep_alive = 120  # Default is 5 seconds
timeout_graceful_shutdown = 120  # Default is 10 seconds

# Server configurations
host = "0.0.0.0"
port = 5001
reload = True

# HTTP settings
h11_max_incomplete_event_size = 512 * 1024  # 512KB (default is 16KB)

# Log settings
log_level = "debug" 