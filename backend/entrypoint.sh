#!/bin/bash
exec gunicorn backend.wsgi:application --bind 0.0.0.0:$BACKEND_PORT