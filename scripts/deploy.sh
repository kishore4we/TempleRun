#!/bin/bash

# Temple Run Deployment Script
# Deploy to production using Docker Compose or Kubernetes

set -e

ENVIRONMENT=${1:-production}

echo "🚀 Temple Run Deployment Script"
echo "================================"
echo "Environment: $ENVIRONMENT"
echo ""

if [ "$ENVIRONMENT" = "docker" ]; then
    echo "Deploying with Docker Compose..."

    # Build backend
    echo "Building backend..."
    cd backend
    docker build -t templerun/api:latest .

    # Start services
    echo "Starting services..."
    cd ..
    docker-compose down
    docker-compose up -d

    # Wait for services
    echo "Waiting for services to be ready..."
    sleep 10

    # Run migrations
    echo "Running migrations..."
    docker exec templerun-api npm run migrate

    # Health check
    echo "Performing health check..."
    curl -f http://localhost/health || exit 1

    echo "✅ Deployment complete!"
    echo "API available at: http://localhost"

elif [ "$ENVIRONMENT" = "kubernetes" ]; then
    echo "Deploying to Kubernetes..."

    # Build and push image
    echo "Building Docker image..."
    cd backend
    docker build -t your-registry/templerun-api:$(git rev-parse --short HEAD) .
    docker tag your-registry/templerun-api:$(git rev-parse --short HEAD) your-registry/templerun-api:latest

    echo "Pushing to registry..."
    docker push your-registry/templerun-api:$(git rev-parse --short HEAD)
    docker push your-registry/templerun-api:latest

    # Deploy to Kubernetes
    echo "Deploying to Kubernetes..."
    cd ../infrastructure/kubernetes

    kubectl apply -f configmap.yaml
    kubectl apply -f deployment.yaml

    # Wait for rollout
    echo "Waiting for rollout to complete..."
    kubectl rollout status deployment/templerun-api -n templerun

    # Health check
    echo "Performing health check..."
    kubectl get pods -n templerun

    echo "✅ Deployment complete!"

else
    echo "❌ Invalid environment. Use 'docker' or 'kubernetes'"
    exit 1
fi
