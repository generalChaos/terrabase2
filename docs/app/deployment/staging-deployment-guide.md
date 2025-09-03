# Staging Deployment Guide - Portal App

## 🚀 **Ready for Staging Deployment**

Your Portal app is now ready for staging deployment to Vercel! Here's your complete deployment checklist and process.

## ✅ **Pre-Deployment Checklist**

### **1. Build & Test Status**
- ✅ **Production Build**: Working perfectly (4.0s compile time)
- ✅ **Unit Tests**: 9/9 passing
- ✅ **Component Tests**: 6/6 passing  
- ✅ **E2E Tests**: 1/1 passing
- ✅ **Coverage**: 64.28% (above 60% threshold)

### **2. Configuration Status**
- ✅ **Environment Config**: Ready for Vercel deployment
- ✅ **Vercel Config**: `vercel.json` properly configured
- ✅ **URLs**: Will automatically use Vercel URLs in production
- ✅ **GitHub Links**: Ready (update username when needed)

## 🎯 **Deployment Process**

### **Step 1: Deploy to Vercel**

```bash
# From the portal app directory
cd apps/portal

# Deploy to Vercel (first time)
vercel

# Or deploy directly to production
vercel --prod
```

### **Step 2: Verify Deployment**

After deployment, Vercel will provide you with:
- **Staging URL**: `https://terrabase2-portal-xxx.vercel.app`
- **Production URL**: `https://terrabase2.vercel.app` (if you have the domain)

### **Step 3: Test Staging Environment**

1. **Visit the staging URL**
2. **Verify environment detection** - Should show "Live Demo" instead of "Dev Server"
3. **Test external links** - Should point to Railway URLs
4. **Test responsive design** - Mobile/desktop layouts
5. **Run E2E tests against staging**:

```bash
# Update Playwright config to test staging URL
# Then run E2E tests
pnpm test:e2e
```

## 🔧 **Environment Configuration**

### **Development Environment**
- **NODE_ENV**: `development`
- **VERCEL**: `undefined`
- **URLs**: `localhost:3000`, `localhost:3001`, `localhost:3002`
- **Text**: "Dev Server"

### **Vercel Staging/Production**
- **NODE_ENV**: `production`
- **VERCEL**: `1`
- **URLs**: 
  - Portal: `https://terrabase2.vercel.app`
  - Party Game: `https://party-game.railway.app`
  - Magic Marker: `https://magic-marker.railway.app`
- **Text**: "Live Demo"

## 📋 **Post-Deployment Verification**

### **1. Functional Tests**
- [ ] Homepage loads correctly
- [ ] Logo displays properly
- [ ] Project cards render
- [ ] External links work
- [ ] GitHub links work
- [ ] Responsive design works

### **2. Environment Tests**
- [ ] Shows "Live Demo" text (not "Dev Server")
- [ ] Links point to Railway URLs (not localhost)
- [ ] No console errors
- [ ] Fast loading times

### **3. E2E Tests Against Staging**
```bash
# Update baseURL in playwright.config.ts to staging URL
# Then run tests
pnpm test:e2e
```

## 🚨 **Common Issues & Solutions**

### **Issue 1: Links Still Point to Localhost**
**Solution**: Check that `VERCEL=1` environment variable is set in Vercel

### **Issue 2: Build Fails**
**Solution**: Ensure all dependencies are in `package.json` (not just devDependencies)

### **Issue 3: Images Not Loading**
**Solution**: Verify images are in `public/` directory and paths are correct

### **Issue 4: Environment Detection Wrong**
**Solution**: Check `NODE_ENV` and `VERCEL` environment variables in Vercel dashboard

## 🔄 **Continuous Deployment Setup**

### **GitHub Integration**
1. **Connect GitHub repo** to Vercel
2. **Enable auto-deploy** on push to main branch
3. **Set up preview deployments** for pull requests

### **Environment Variables in Vercel**
Set these in your Vercel dashboard:
- `NODE_ENV`: `production`
- `VERCEL`: `1`

## 📊 **Monitoring & Analytics**

### **Vercel Analytics**
- Enable Vercel Analytics for performance monitoring
- Monitor Core Web Vitals
- Track user interactions

### **Error Monitoring**
- Consider adding Sentry for error tracking
- Monitor console errors
- Track failed requests

## 🎯 **Next Steps After Staging**

### **1. Production Domain**
- Set up custom domain: `terrabase2.com`
- Configure DNS settings
- Enable HTTPS

### **2. Performance Optimization**
- Add performance monitoring
- Optimize images
- Implement caching strategies

### **3. Advanced Features**
- Add analytics
- Implement error tracking
- Set up monitoring alerts

## 🚀 **Deployment Commands Summary**

```bash
# Build locally
pnpm build

# Test production build
pnpm start

# Deploy to Vercel
vercel --prod

# Run tests against staging
pnpm test:e2e
```

## ✅ **Success Criteria**

Your staging deployment is successful when:
- ✅ Portal loads at Vercel URL
- ✅ Shows "Live Demo" text
- ✅ External links work
- ✅ Responsive design works
- ✅ No console errors
- ✅ Fast loading times
- ✅ E2E tests pass

## 🎉 **You're Ready!**

Your Portal app is **staging-ready** with:
- ✅ Comprehensive test suite
- ✅ Production build working
- ✅ Environment configuration correct
- ✅ Vercel configuration ready
- ✅ Deployment process documented

**Go ahead and deploy to staging!** 🚀
