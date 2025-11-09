# TekPay Gateway - Production Deployment Guide

This guide covers deploying TekPay Gateway to production environments with proper security, monitoring, and performance configurations.

## Prerequisites

### Infrastructure Requirements

- **Application Server**: Linux server with Node.js 18+ (2+ CPU cores, 4GB+ RAM)
- **Database**: PostgreSQL 13+ (dedicated server recommended)
- **Cache**: Redis 6+ (dedicated server recommended)
- **Load Balancer**: Nginx or similar (for SSL termination and load balancing)
- **Monitoring**: Prometheus + Grafana (optional but recommended)

### Security Requirements

- SSL/TLS certificates
- Firewall configuration
- VPN or private network access
- Secure environment variable management
- Regular security updates

## Deployment Steps

### 1. Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Create application user
sudo useradd -m -s /bin/bash tekpay
sudo usermod -aG sudo tekpay

# Create application directory
sudo mkdir -p /opt/tekpay
sudo chown tekpay:tekpay /opt/tekpay
```

### 2. Database Setup

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE tekpay_gateway_prod;
CREATE USER tekpay_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE tekpay_gateway_prod TO tekpay_user;
\q

# Configure PostgreSQL for production
sudo nano /etc/postgresql/13/main/postgresql.conf
# Set: shared_buffers = 256MB, effective_cache_size = 1GB, max_connections = 100

sudo nano /etc/postgresql/13/main/pg_hba.conf
# Configure authentication methods

sudo systemctl restart postgresql
```

### 3. Redis Setup

```bash
# Install Redis
sudo apt install redis-server

# Configure Redis for production
sudo nano /etc/redis/redis.conf
# Set: maxmemory 512mb, maxmemory-policy allkeys-lru
# Set: requirepass your_redis_password

sudo systemctl restart redis-server
```

### 4. Application Deployment

```bash
# Switch to application user
sudo su - tekpay

# Clone repository
cd /opt/tekpay
git clone <your-repository-url> .

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Create production environment file
cp .env.example .env.production
nano .env.production
```

### 5. Environment Configuration

Create `/opt/tekpay/.env.production`:

```bash
# Application Configuration
NODE_ENV=production
PORT=3000

# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=tekpay_gateway_prod
DATABASE_USERNAME=tekpay_user
DATABASE_PASSWORD=your_secure_database_password
DATABASE_SSL=true
DATABASE_SYNCHRONIZE=false
DATABASE_LOGGING=false

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0

# Security Configuration
JWT_SECRET=your_super_secure_jwt_secret_min_64_chars_for_production_use_only
WEBHOOK_SECRET=your_super_secure_webhook_secret_min_64_chars_for_production

# MTN Production Configuration
MTN_BASE_URL=https://momodeveloper.mtn.com
MTN_CLIENT_ID=your_production_mtn_client_id
MTN_CLIENT_SECRET=your_production_mtn_client_secret
MTN_SUBSCRIPTION_KEY=your_production_mtn_subscription_key
MTN_CALLBACK_HOST=https://your-domain.com
MTN_ENVIRONMENT=production

# Airtel Production Configuration
AIRTEL_BASE_URL=https://openapi.airtel.africa
AIRTEL_CLIENT_ID=your_production_airtel_client_id
AIRTEL_CLIENT_SECRET=your_production_airtel_client_secret
AIRTEL_CALLBACK_HOST=https://your-domain.com
AIRTEL_ENVIRONMENT=production

# CORS Configuration
CORS_ORIGIN=https://your-admin-dashboard.com,https://your-api-consumers.com
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE_ENABLED=true
LOG_FILE_PATH=/var/log/tekpay/app.log

# Monitoring Configuration
METRICS_ENABLED=true
HEALTH_CHECK_ENABLED=true
PERFORMANCE_MONITORING_ENABLED=true

# Security Configuration
MAX_REQUEST_SIZE=1048576
BLOCKED_IPS=
CACHE_ENABLED=true
DEFAULT_CACHE_TTL=300000
```

### 6. Database Migration

```bash
# Run migrations
npm run migration:run

# Seed production data (if needed)
npm run seed:run
```

### 7. Process Management with PM2

Create `/opt/tekpay/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'tekpay-gateway',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
    },
    env_file: '.env.production',
    error_file: '/var/log/tekpay/error.log',
    out_file: '/var/log/tekpay/out.log',
    log_file: '/var/log/tekpay/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    max_restarts: 10,
    min_uptime: '10s',
  }]
};
```

Start the application:

```bash
# Create log directory
sudo mkdir -p /var/log/tekpay
sudo chown tekpay:tekpay /var/log/tekpay

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u tekpay --hp /home/tekpay
```

### 8. Nginx Configuration

Create `/etc/nginx/sites-available/tekpay`:

```nginx
upstream tekpay_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Request size limit
    client_max_body_size 1M;

    location / {
        proxy_pass http://tekpay_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    # Health check endpoint (no rate limiting)
    location /health {
        proxy_pass http://tekpay_backend;
        access_log off;
    }

    # Metrics endpoint (restrict access)
    location /metrics {
        allow 10.0.0.0/8;
        allow 172.16.0.0/12;
        allow 192.168.0.0/16;
        deny all;
        proxy_pass http://tekpay_backend;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/tekpay /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 9. Monitoring Setup

#### Log Rotation

Create `/etc/logrotate.d/tekpay`:

```
/var/log/tekpay/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 tekpay tekpay
    postrotate
        pm2 reloadLogs
    endscript
}
```

#### System Monitoring

Create monitoring script `/opt/tekpay/scripts/health-check.sh`:

```bash
#!/bin/bash
HEALTH_URL="http://localhost:3000/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -ne 200 ]; then
    echo "Health check failed with status $RESPONSE"
    # Send alert (email, Slack, etc.)
    # Restart application if needed
    pm2 restart tekpay-gateway
fi
```

Add to crontab:

```bash
# Check health every 5 minutes
*/5 * * * * /opt/tekpay/scripts/health-check.sh
```

### 10. Security Hardening

```bash
# Configure firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no

# Setup fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

### 11. Backup Strategy

Create backup script `/opt/tekpay/scripts/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/tekpay"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -h localhost -U tekpay_user tekpay_gateway_prod > $BACKUP_DIR/db_$DATE.sql

# Application backup
tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C /opt/tekpay --exclude=node_modules .

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

## Post-Deployment Verification

### 1. Health Checks

```bash
# Check application health
curl https://your-domain.com/health

# Check metrics
curl https://your-domain.com/metrics

# Check API functionality
curl -H "X-API-Key: your-api-key" https://your-domain.com/api/v1/payments
```

### 2. Performance Testing

```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test API performance
ab -n 1000 -c 10 -H "X-API-Key: your-api-key" https://your-domain.com/api/v1/payments
```

### 3. Security Testing

```bash
# Test SSL configuration
curl -I https://your-domain.com

# Test rate limiting
for i in {1..25}; do curl https://your-domain.com/health; done
```

## Maintenance

### Regular Tasks

- **Daily**: Check logs and metrics
- **Weekly**: Review security logs and update dependencies
- **Monthly**: Database maintenance and backup verification
- **Quarterly**: Security audit and performance review

### Monitoring Alerts

Set up alerts for:
- Application downtime
- High error rates
- Database connection issues
- High memory/CPU usage
- Failed payment processing
- Security events

### Scaling Considerations

- **Horizontal scaling**: Add more application instances behind load balancer
- **Database scaling**: Read replicas for read-heavy workloads
- **Cache scaling**: Redis cluster for high availability
- **CDN**: For static assets and API responses

## Troubleshooting

### Common Issues

1. **Application won't start**: Check environment variables and database connectivity
2. **High memory usage**: Review cache settings and enable memory monitoring
3. **Slow API responses**: Check database queries and enable performance profiling
4. **SSL certificate issues**: Verify certificate chain and renewal process

### Log Analysis

```bash
# View application logs
pm2 logs tekpay-gateway

# View error logs
tail -f /var/log/tekpay/error.log

# Search for specific errors
grep "ERROR" /var/log/tekpay/app.log | tail -20
```

This production deployment guide ensures your TekPay Gateway is secure, performant, and ready for production traffic.
