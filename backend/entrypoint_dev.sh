#!/bin/bash
# Run migrations
echo "Running migrations..."
python manage.py migrate

# Start the development server
echo "Starting development server..."
exec python -m uvicorn backend.asgi:application --host 0.0.0.0 --port $BACKEND_PORT --reload