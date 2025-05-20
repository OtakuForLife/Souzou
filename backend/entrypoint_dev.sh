#!/bin/bash

# Run migrations
echo "Running migrations..."
python manage.py migrate

# Start the development server
echo "Starting development server..."
exec python manage.py runserver 0.0.0.0:$BACKEND_PORT
