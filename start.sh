#!/bin/bash

# Wait for database to be ready
echo "Waiting for database to be ready..."
while ! nc -z db 5432; do
  sleep 1
done
echo "Database is ready!"

# Start FastAPI backend
echo "Starting FastAPI backend..."
cd /app
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &

# Start React frontend
echo "Starting React frontend..."
cd /app/frontend
npm start &

# Keep container running
wait 