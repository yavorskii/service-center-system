#!/bin/bash
set -e
docker compose up -d --build
echo "RepairHub CRM system is starting up..."
echo "Frontend Client Portal: http://localhost:3000"
echo "Backend REST API Swagger: http://localhost:8080/swagger-ui.html"
echo "PostgreSQL Database: localhost:5432"
