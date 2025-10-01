# Deployment Checklist

Use this checklist to ensure a successful deployment of the Image Processor API.

## Pre-Deployment

### ✅ Code Preparation
- [ ] All tests passing (`./deploy.sh test`)
- [ ] Code committed to repository
- [ ] Environment variables configured
- [ ] Documentation updated

### ✅ Environment Setup
- [ ] Supabase project created (if using database storage)
- [ ] Database tables created (see railway-deploy.md)
- [ ] Environment variables documented
- [ ] CORS origins configured for your frontend

### ✅ Security Review
- [ ] No secrets in code
- [ ] Environment variables properly set
- [ ] CORS configured correctly
- [ ] File validation limits appropriate
- [ ] Rate limiting configured (if using nginx)

## Railway Deployment

### ✅ Railway Setup
- [ ] Railway account created
- [ ] Railway CLI installed (`npm install -g @railway/cli`)
- [ ] Logged into Railway (`railway login`)
- [ ] Project created in Railway dashboard

### ✅ Environment Variables
- [ ] `SUPABASE_URL` set
- [ ] `SUPABASE_ANON_KEY` set
- [ ] `SUPABASE_SERVICE_KEY` set
- [ ] `STORAGE_TYPE=supabase`
- [ ] `CORS_ORIGINS` configured
- [ ] File validation limits set

### ✅ Deployment
- [ ] Repository connected to Railway
- [ ] Root directory set to `apps/image-processor`
- [ ] Deployment triggered
- [ ] Build logs reviewed (no errors)
- [ ] Service is running

### ✅ Verification
- [ ] Health check passes: `https://your-app.railway.app/health`
- [ ] API docs accessible: `https://your-app.railway.app/docs`
- [ ] Test endpoint works: `curl https://your-app.railway.app/health`
- [ ] Database connection working
- [ ] Logs show no errors

## Docker Compose Deployment

### ✅ Server Setup
- [ ] VPS/server provisioned
- [ ] Docker installed
- [ ] Docker Compose installed
- [ ] Domain configured (optional)
- [ ] SSL certificates obtained (optional)

### ✅ Configuration
- [ ] `.env` file created and configured
- [ ] `docker-compose.prod.yml` reviewed
- [ ] Nginx configuration updated (if using)
- [ ] File permissions set correctly

### ✅ Deployment
- [ ] Code deployed to server
- [ ] `docker-compose -f deploy/docker-compose.prod.yml up -d`
- [ ] Services started successfully
- [ ] No error logs

### ✅ Verification
- [ ] Health check passes: `http://your-server:8000/health`
- [ ] API docs accessible: `http://your-server:8000/docs`
- [ ] Nginx working (if configured)
- [ ] SSL working (if configured)
- [ ] Database connection working

## Post-Deployment

### ✅ Monitoring Setup
- [ ] Health monitoring configured
- [ ] Log aggregation set up (optional)
- [ ] Error alerting configured (optional)
- [ ] Performance monitoring (optional)

### ✅ Frontend Integration
- [ ] Frontend environment variables updated
- [ ] API base URL configured
- [ ] CORS working from frontend
- [ ] Test image processing from frontend

### ✅ Documentation
- [ ] Deployment URL documented
- [ ] Environment variables documented
- [ ] Team notified of deployment
- [ ] Monitoring dashboards shared

## Testing

### ✅ Basic Functionality
- [ ] Health endpoint responds
- [ ] API documentation loads
- [ ] Logo processing works
- [ ] Asset pack generation works
- [ ] Banner generation works

### ✅ Error Handling
- [ ] Invalid requests return proper errors
- [ ] File size limits enforced
- [ ] Rate limiting works (if configured)
- [ ] Database errors handled gracefully

### ✅ Performance
- [ ] Response times acceptable
- [ ] Memory usage stable
- [ ] No memory leaks
- [ ] Concurrent requests handled

## Maintenance

### ✅ Regular Tasks
- [ ] Monitor logs for errors
- [ ] Check database usage
- [ ] Review performance metrics
- [ ] Clean up old records (if needed)

### ✅ Updates
- [ ] Plan for regular updates
- [ ] Test updates in staging
- [ ] Backup before updates
- [ ] Monitor after updates

## Rollback Plan

### ✅ Emergency Procedures
- [ ] Rollback procedure documented
- [ ] Previous version tagged
- [ ] Database backup available
- [ ] Team knows rollback process

### ✅ Communication
- [ ] Incident response plan
- [ ] Team contact information
- [ ] Status page (if applicable)
- [ ] User notification process

## Success Criteria

### ✅ Functional
- [ ] All API endpoints working
- [ ] Image processing successful
- [ ] Database operations working
- [ ] Error handling proper

### ✅ Performance
- [ ] Response times < 30s for processing
- [ ] Health check < 1s
- [ ] Memory usage stable
- [ ] No crashes or restarts

### ✅ Security
- [ ] No exposed secrets
- [ ] CORS properly configured
- [ ] File validation working
- [ ] Rate limiting active (if configured)

## Troubleshooting

### Common Issues
- [ ] **Build fails**: Check Python dependencies, system packages
- [ ] **Memory issues**: Increase memory limits, monitor usage
- [ ] **Database errors**: Check Supabase connection, environment variables
- [ ] **CORS errors**: Update CORS_ORIGINS with frontend URLs
- [ ] **File processing fails**: Check file validation, format support

### Debug Commands
```bash
# Check service status
docker-compose -f deploy/docker-compose.prod.yml ps

# View logs
docker-compose -f deploy/docker-compose.prod.yml logs -f

# Health check
curl http://localhost:8000/health

# Statistics
curl http://localhost:8000/api/v1/stats
```

## Sign-off

- [ ] **Technical Lead**: Deployment reviewed and approved
- [ ] **QA**: Testing completed successfully
- [ ] **DevOps**: Infrastructure ready
- [ ] **Product**: Feature ready for users

**Deployment Date**: ___________  
**Deployed By**: ___________  
**Version**: ___________  
**Environment**: ___________
