#!/bin/bash
exec python -m uvicorn backend.asgi:application --host 0.0.0.0 --port $BACKEND_PORT