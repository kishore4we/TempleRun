# Temple Run Deployment Guide

This guide covers deploying Temple Run from 10K users to 1M users.

## Table of Contents
1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [Kubernetes Deployment](#kubernetes-deployment)
4. [Scaling Strategy](#scaling-strategy)
5. [Monitoring](#monitoring)

## Local Development

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Setup Development Environment

```bash
# 1. Clone repository
git clone <repository-url>
cd TempleRun

# 2. Start database services
docker-compose -f docker-compose.dev.yml up -d

# 3. Setup backend
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration

# Run migrations
npm run migrate

# Start backend server
npm run dev

# 4. Setup mobile app
cd ../mobile
npm install

# For Android
npx react-native run-android

# For iOS
npx react-native run-ios
```

## Docker Deployment

### Single Server Deployment (10K Users)

```bash
# 1. Build and start services
docker-compose up -d

# 2. Run database migrations
docker exec templerun-api npm run migrate

# 3. Check health
curl http://localhost/health
```

### Configuration

Edit `docker-compose.yml` and set environment variables:

```yaml
environment:
  JWT_SECRET: your-production-jwt-secret
  JWT_REFRESH_SECRET: your-production-refresh-secret
```

### Service URLs
- API: http://localhost:3000
- NGINX: http://localhost
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (1.25+)
- kubectl configured
- Container registry (Docker Hub, GCR, ECR)

### Initial Setup (10K Users)

```bash
# 1. Build and push Docker image
cd backend
docker build -t your-registry/templerun-api:latest .
docker push your-registry/templerun-api:latest

# 2. Create namespace
kubectl create namespace templerun

# 3. Create secrets
kubectl create secret generic templerun-secrets \
  --from-literal=db_user=postgres \
  --from-literal=db_password=your-secure-password \
  --from-literal=jwt_secret=your-jwt-secret \
  --from-literal=jwt_refresh_secret=your-refresh-secret \
  -n templerun

# 4. Deploy PostgreSQL (use managed service in production)
kubectl apply -f infrastructure/kubernetes/postgres.yaml -n templerun

# 5. Deploy Redis (use managed service in production)
kubectl apply -f infrastructure/kubernetes/redis.yaml -n templerun

# 6. Deploy ConfigMap
kubectl apply -f infrastructure/kubernetes/configmap.yaml -n templerun

# 7. Deploy API
kubectl apply -f infrastructure/kubernetes/deployment.yaml -n templerun

# 8. Verify deployment
kubectl get pods -n templerun
kubectl get svc -n templerun
```

### Ingress Setup

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: templerun-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - api.templerun.com
    secretName: templerun-tls
  rules:
  - host: api.templerun.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: templerun-api
            port:
              number: 3000
```

## Scaling Strategy

### Stage 1: 10K Users
**Infrastructure:**
- 2-3 API server instances
- Single PostgreSQL instance (4 vCPU, 8GB RAM)
- Single Redis instance (2GB RAM)
- Basic monitoring

**Cost:** ~$100-200/month

```bash
kubectl scale deployment templerun-api --replicas=3 -n templerun
```

### Stage 2: 100K Users
**Infrastructure:**
- 10-15 API server instances (auto-scaled)
- PostgreSQL read replicas (1 master, 2 replicas)
- Redis cluster (3 nodes)
- CDN for static assets
- Advanced monitoring + alerts

**Cost:** ~$500-1000/month

```yaml
# Update HPA in deployment.yaml
minReplicas: 10
maxReplicas: 20
```

### Stage 3: 1M Users
**Infrastructure:**
- 50+ API server instances (auto-scaled)
- PostgreSQL sharded (3 shards, each with replicas)
- Redis cluster (5-7 nodes)
- Multi-region deployment
- CDN + edge caching
- Dedicated monitoring stack

**Cost:** ~$5000-10000/month

**Deployment:**

```bash
# Enable horizontal autoscaling
kubectl apply -f infrastructure/kubernetes/deployment.yaml -n templerun

# Autoscaling will handle: 3 min replicas → 50 max replicas
# Based on CPU (70%) and Memory (80%) thresholds
```

## Database Scaling

### Read Replicas

```sql
-- On master server
CREATE PUBLICATION templerun_pub FOR ALL TABLES;

-- On replica server
CREATE SUBSCRIPTION templerun_sub
  CONNECTION 'host=master-db port=5432 dbname=templerun user=replicator password=xxx'
  PUBLICATION templerun_pub;
```

### Connection Pooling

Use PgBouncer for connection pooling:

```ini
[databases]
templerun = host=postgres-master port=5432 dbname=templerun

[pgbouncer]
pool_mode = transaction
max_client_conn = 10000
default_pool_size = 25
```

### Sharding Strategy

For 1M+ users, implement application-level sharding:

```javascript
// Shard by user_id hash
function getShardId(userId) {
  const hash = hashFunction(userId);
  return hash % NUM_SHARDS;
}

// Route queries to appropriate shard
const shard = getShardId(userId);
const db = dbConnections[shard];
```

## Redis Scaling

### Cluster Mode (100K+ users)

```bash
# Create Redis cluster
kubectl apply -f infrastructure/kubernetes/redis-cluster.yaml

# 6 nodes (3 masters, 3 replicas)
```

### Sentinel Mode (Alternative)

```yaml
# Redis Sentinel configuration
sentinel monitor templerun-master redis-master 6379 2
sentinel down-after-milliseconds templerun-master 5000
sentinel parallel-syncs templerun-master 1
sentinel failover-timeout templerun-master 10000
```

## Monitoring

### Prometheus Setup

```bash
# Install Prometheus operator
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring

# Add ServiceMonitor for Temple Run
kubectl apply -f infrastructure/kubernetes/servicemonitor.yaml
```

### Key Metrics to Monitor

1. **API Performance**
   - Request rate (requests/sec)
   - Response time (p50, p95, p99)
   - Error rate (%)
   - Active connections

2. **Database**
   - Connection pool usage
   - Query duration
   - Cache hit ratio
   - Replication lag

3. **Redis**
   - Memory usage
   - Cache hit rate
   - Connected clients
   - Keys count

4. **System**
   - CPU usage
   - Memory usage
   - Network I/O
   - Disk I/O

### Alerts

```yaml
# Example Prometheus alert
groups:
- name: templerun
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
    for: 5m
    annotations:
      summary: "High error rate detected"

  - alert: DatabaseConnectionsHigh
    expr: pg_stat_database_numbackends > 80
    for: 5m
    annotations:
      summary: "Database connections approaching limit"
```

## Load Testing

### Using k6

```javascript
// load-test.js
import http from 'k6/http';
import {check, sleep} from 'k6';

export let options = {
  stages: [
    {duration: '2m', target: 100},   // Ramp to 100 users
    {duration: '5m', target: 1000},  // Ramp to 1000 users
    {duration: '2m', target: 0},     // Ramp down
  ],
};

export default function() {
  // Test game session
  let res = http.post('http://api/v1/game/start');
  check(res, {'status is 200': (r) => r.status === 200});
  sleep(1);
}
```

Run load test:
```bash
k6 run load-test.js
```

## Backup Strategy

### Database Backups

```bash
# Daily backup
pg_dump -h localhost -U postgres templerun | gzip > backup-$(date +%Y%m%d).sql.gz

# Upload to S3
aws s3 cp backup-$(date +%Y%m%d).sql.gz s3://templerun-backups/
```

### Redis Persistence

```conf
# redis.conf
save 900 1      # Save after 900 sec if at least 1 key changed
save 300 10     # Save after 300 sec if at least 10 keys changed
save 60 10000   # Save after 60 sec if at least 10000 keys changed

appendonly yes
appendfsync everysec
```

## Disaster Recovery

### RTO/RPO Targets
- RTO (Recovery Time Objective): 1 hour
- RPO (Recovery Point Objective): 5 minutes

### Recovery Steps

1. **Database Failure**
   ```bash
   # Promote read replica to master
   kubectl exec -it postgres-replica -- pg_ctl promote

   # Update API to point to new master
   kubectl set env deployment/templerun-api DB_HOST=postgres-replica
   ```

2. **Complete Region Failure**
   ```bash
   # Switch to backup region
   kubectl config use-context backup-region

   # Restore latest backup
   psql -h new-db < latest-backup.sql

   # Update DNS to point to backup region
   ```

## Cost Optimization

### For 10K Users
- Use single region
- Managed PostgreSQL (AWS RDS, GCP Cloud SQL)
- Managed Redis (AWS ElastiCache, GCP Memorystore)
- Basic monitoring

### For 100K Users
- Read replicas for database
- CDN for static content (CloudFront, CloudFlare)
- Reserved instances for predictable load

### For 1M Users
- Multi-region for latency
- Auto-scaling with strict limits
- Database sharding
- Aggressive caching strategy
- Spot instances for non-critical workloads

## Security Checklist

- [ ] Use HTTPS/TLS for all connections
- [ ] Rotate JWT secrets regularly
- [ ] Enable database encryption at rest
- [ ] Use secrets management (AWS Secrets Manager, HashiCorp Vault)
- [ ] Enable network policies in Kubernetes
- [ ] Regular security audits
- [ ] DDoS protection (CloudFlare, AWS Shield)
- [ ] Rate limiting per IP and user
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] XSS protection headers

## Troubleshooting

### High API Response Times
```bash
# Check pod resources
kubectl top pods -n templerun

# Check database slow queries
SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;

# Check Redis latency
redis-cli --latency
```

### Database Connection Errors
```bash
# Check connection pool
kubectl logs -n templerun deployment/templerun-api | grep "pool"

# Increase max connections in PostgreSQL
ALTER SYSTEM SET max_connections = 200;
```

### Memory Issues
```bash
# Check memory usage
kubectl top pods -n templerun

# Increase pod memory limits
kubectl set resources deployment templerun-api --limits=memory=1Gi
```
