# 🚀 Fraudies Deployment Checklist

## Pre-Deployment (Development Complete)

### Code Quality
- [ ] All tests passing (if tests exist)
- [ ] No console.log statements in production code
- [ ] TypeScript compilation successful with no errors
- [ ] Linting passes without errors
- [ ] Dependencies updated to stable versions
- [ ] Remove unused dependencies

### Security Audit
- [ ] All `.env.example` files created
- [ ] No secrets committed to git (check with `git log -S "password"`)
- [ ] `.gitignore` includes `.env`, `node_modules/`, `.venv/`
- [ ] Strong JWT_SECRET generated (32+ characters)
- [ ] Strong WEBHOOK_SECRET generated
- [ ] Database credentials are strong
- [ ] Redis password set
- [ ] CORS restricted to production domain only

### Database
- [ ] Prisma migrations reviewed
- [ ] Migration files in version control
- [ ] Database indexes added for frequent queries
- [ ] Test data removed from production database
- [ ] Backup strategy planned

---

## Environment Setup

### Backend API (.env)
```bash
DATABASE_URL="postgresql://user:password@host:5432/fraudies?schema=public&sslmode=require"
PORT=3001
JWT_SECRET="<32+ char random string>"
CORS_ORIGIN="https://yourdomain.com"
ML_ENGINE_URL="http://ml-engine:8000"  # Internal network
WEBHOOK_SECRET="<32+ char random string>"
NODE_ENV="production"
```

### ML Engine (.env)
```bash
HIGH_RISK_THRESHOLD=0.70
PENDING_THRESHOLD=0.40
CORS_ORIGIN="http://api:3001"  # Internal network
```

### Frontend (.env.production)
```bash
NEXT_PUBLIC_API_URL="https://api.yourdomain.com/api/v1"
```

### Verify Environment Variables
- [ ] All required vars set in production
- [ ] No `localhost` references
- [ ] URLs use HTTPS in production
- [ ] Internal services use internal DNS/network

---

## Infrastructure Setup

### Server/Platform
- [ ] Server provisioned (VPS/Cloud)
- [ ] Node.js 20+ installed
- [ ] Python 3.10+ installed
- [ ] PostgreSQL 15+ installed/provisioned
- [ ] Redis 7+ installed/provisioned
- [ ] NGINX installed (if using reverse proxy)
- [ ] Firewall configured (UFW/Security Groups)
- [ ] SSH keys configured (no password auth)
- [ ] Non-root user created for app

### Database
- [ ] PostgreSQL user created with limited permissions
- [ ] Database created
- [ ] SSL/TLS enabled for connections
- [ ] Connection pooling configured (PgBouncer if needed)
- [ ] Automated backups enabled
- [ ] Backup restoration tested

### Redis
- [ ] Password authentication enabled
- [ ] Bind to internal network only
- [ ] Persistence (AOF) enabled
- [ ] Memory limit configured

---

## Application Deployment

### Backend API
- [ ] Code deployed to `/var/www/fraudies/api` or equivalent
- [ ] Dependencies installed: `npm ci --production`
- [ ] Prisma client generated: `npx prisma generate`
- [ ] Database migrated: `npx prisma migrate deploy`
- [ ] Application built: `npm run build`
- [ ] PM2/systemd service configured
- [ ] Service starts automatically on reboot
- [ ] Logs directory created with proper permissions

### ML Engine
- [ ] Code deployed to `/var/www/fraudies/ml-engine` or equivalent
- [ ] Virtual environment created
- [ ] Dependencies installed: `pip install -r requirements.txt`
- [ ] Gunicorn installed for production
- [ ] systemd service configured
- [ ] Service starts automatically on reboot
- [ ] Model files present and loadable

### Frontend
- [ ] Code deployed to `/var/www/fraudies/frontend` or equivalent
- [ ] Dependencies installed: `npm ci --production`
- [ ] Environment variables set
- [ ] Production build created: `npm run build`
- [ ] PM2/systemd service configured
- [ ] Service starts automatically on reboot

---

## Web Server Configuration

### NGINX
- [ ] Site configuration file created
- [ ] SSL certificates obtained (Let's Encrypt)
- [ ] Auto-renewal configured for SSL
- [ ] Reverse proxy configured for API
- [ ] Reverse proxy configured for Frontend
- [ ] Security headers added
- [ ] Rate limiting configured
- [ ] Gzip compression enabled
- [ ] Log rotation configured
- [ ] Configuration tested: `nginx -t`
- [ ] Service restarted

### SSL/TLS
- [ ] Certificates issued for:
  - [ ] yourdomain.com
  - [ ] www.yourdomain.com  
  - [ ] api.yourdomain.com
- [ ] HTTPS redirect configured
- [ ] HSTS header enabled
- [ ] TLS 1.2+ only
- [ ] Strong cipher suites configured

---

## DNS Configuration

- [ ] A record: yourdomain.com → Server IP
- [ ] A record: www.yourdomain.com → Server IP
- [ ] A record: api.yourdomain.com → Server IP
- [ ] DNS propagation verified (24-48 hours)
- [ ] TTL adjusted appropriately

---

## Testing & Verification

### Health Checks
```bash
# API
curl https://api.yourdomain.com/api/v1/health
# Expected: {"status":"ok"}

# ML Engine (if exposed)
curl https://api.yourdomain.com:8000/
# Expected: {"status":"ok","service":"fraud-detection-ml-engine"}

# Frontend
curl https://yourdomain.com
# Expected: HTML response
```

### Functional Tests
- [ ] User registration works
- [ ] User login works
- [ ] JWT token generation works
- [ ] Create transaction endpoint works
- [ ] ML fraud scoring works
- [ ] Transaction list loads
- [ ] Dashboard displays metrics
- [ ] Webhook ingestion works (if applicable)

### Performance Tests
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] ML prediction time < 100ms
- [ ] Database queries optimized
- [ ] No memory leaks after 24h operation

### Security Tests
- [ ] HTTPS enforced (HTTP redirects)
- [ ] CORS working correctly
- [ ] Rate limiting tested
- [ ] JWT expiration working
- [ ] SQL injection prevented (Prisma handles this)
- [ ] XSS prevented (React handles this)
- [ ] No sensitive data in logs
- [ ] Error messages don't expose internals

---

## Monitoring & Logging

### Application Monitoring
- [ ] PM2 monitoring active: `pm2 monit`
- [ ] systemd services running: `systemctl status fraudies-*`
- [ ] Error tracking setup (Sentry/Rollbar)
- [ ] APM tool configured (New Relic/Datadog)
- [ ] Uptime monitoring (UptimeRobot/Pingdom)

### Log Management
- [ ] API logs accessible
- [ ] ML Engine logs accessible
- [ ] NGINX access/error logs rotating
- [ ] Database logs configured
- [ ] Log aggregation setup (optional: ELK stack)

### Alerts
- [ ] Disk space alerts (> 80% usage)
- [ ] Memory alerts (> 90% usage)
- [ ] CPU alerts (> 80% for 5 minutes)
- [ ] Service down alerts
- [ ] Error rate alerts
- [ ] Database connection alerts

---

## Backup & Recovery

### Automated Backups
- [ ] Database backup script created
- [ ] Cron job scheduled (daily at 2 AM)
- [ ] Backups stored off-server
- [ ] Backup retention policy (30 days)
- [ ] Code repository backed up (GitHub/GitLab)

### Disaster Recovery
- [ ] Backup restoration tested
- [ ] Recovery time objective (RTO) defined
- [ ] Recovery point objective (RPO) defined
- [ ] Runbook documented for common failures

---

## Performance Optimization

### Backend
- [ ] Database connection pooling enabled
- [ ] Redis caching implemented
- [ ] Response compression enabled
- [ ] Slow query logging enabled
- [ ] Database indexes verified

### Frontend
- [ ] Next.js Image Optimization enabled
- [ ] Static assets served from CDN
- [ ] Code splitting implemented
- [ ] Service worker for offline support (optional)

### ML Engine
- [ ] Model predictions cached
- [ ] Worker count optimized (4x CPU cores)
- [ ] Request timeout configured

---

## Documentation

- [ ] API documentation updated
- [ ] Environment variables documented
- [ ] Deployment process documented
- [ ] Troubleshooting guide created
- [ ] Runbook for operations team
- [ ] Architecture diagram created

---

## Post-Deployment

### First 24 Hours
- [ ] Monitor error rates
- [ ] Check resource usage (CPU, memory, disk)
- [ ] Verify all endpoints responding
- [ ] Check log files for errors
- [ ] Verify backups ran successfully

### First Week
- [ ] Performance metrics baseline established
- [ ] User feedback collected
- [ ] No critical bugs reported
- [ ] Database growth tracked
- [ ] Cost monitoring enabled

### Ongoing Maintenance
- [ ] Security updates scheduled (monthly)
- [ ] Dependency updates (quarterly)
- [ ] Certificate renewal monitoring
- [ ] Capacity planning reviewed
- [ ] Incident response plan tested

---

## Rollback Plan

### If Deployment Fails
1. **Database**: Restore from last backup
2. **Code**: Revert to previous Git tag
3. **Services**: Restart previous version
4. **DNS**: Revert to old servers (if changed)

### Rollback Checklist
- [ ] Previous version tagged in Git
- [ ] Database backup taken before migration
- [ ] Rollback procedure documented
- [ ] Rollback tested in staging

---

## Quick Command Reference

### Start Services
```bash
pm2 start fraudies-api
pm2 start fraudies-frontend
sudo systemctl start fraudies-ml
```

### View Logs
```bash
pm2 logs fraudies-api
sudo journalctl -u fraudies-ml -f
sudo tail -f /var/log/nginx/error.log
```

### Restart Services
```bash
pm2 restart fraudies-api
pm2 restart fraudies-frontend
sudo systemctl restart fraudies-ml
sudo systemctl restart nginx
```

### Database
```bash
# Backup
pg_dump -h localhost -U fraudies_user fraudies > backup.sql

# Restore
psql -h localhost -U fraudies_user fraudies < backup.sql

# Migrations
cd /var/www/fraudies/api
npx prisma migrate deploy
```

---

## Sign-Off

**Deployed By**: _________________  
**Date**: _________________  
**Version**: _________________  
**Reviewed By**: _________________  

### Deployment Status
- [ ] All checklist items completed
- [ ] Stakeholders notified
- [ ] Documentation updated
- [ ] Monitoring confirmed working
- [ ] Backups verified
- [ ] Rollback plan ready

---

**Emergency Contacts**:
- DevOps: [email/phone]
- Database Admin: [email/phone]
- On-Call Engineer: [email/phone]

**Critical Resources**:
- GitHub: https://github.com/yourorg/fraudies
- Monitoring Dashboard: [URL]
- Log Aggregation: [URL]
- Documentation: [URL]
