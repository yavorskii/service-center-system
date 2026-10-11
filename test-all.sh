#!/bin/bash
set -e
echo "1. Running backend tests..."
mvn clean test -f backend/pom.xml
echo "2. Running frontend build and type checking..."
npm run build --prefix frontend
echo "3. Validating Docker Compose configuration..."
docker compose config
echo "All tests and build gates passed successfully!"
