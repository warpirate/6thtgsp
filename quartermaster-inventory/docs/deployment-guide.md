# 🚀 Deployment Guide - Quarter Master Inventory

This guide covers deploying the Quarter Master Inventory Management System to production.

## 🎯 Pre-Deployment Checklist

### ✅ Code Quality
- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] Code formatted with Prettier
- [ ] No console.log statements in production code
- [ ] Environment variables properly configured

### ✅ Security
- [ ] Supabase RLS policies enabled and tested
- [ ] API keys properly secured
- [ ] Authentication flow tested
- [ ] Role-based access control verified
- [ ] File upload security validated

### ✅ Performance
- [ ] Production build optimized (`npm run build`)
- [ ] Images optimized
- [ ] Unused dependencies removed
- [ ] Bundle size analyzed
- [ ] Loading states implemented

### ✅ Testing
- [ ] Authentication tested with all roles
- [ ] CRUD operations verified
- [ ] File uploads working
- [ ] Responsive design confirmed
- [ ] Error handling tested

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)

**Why Vercel?**
- Zero-config deployment
- Automatic HTTPS
- Global CDN
- Serverless functions support
- Git integration

**Steps:**

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Configure Environment Variables**
   In Vercel dashboard, add:
   ```
   VITE_SUPABASE_URL=https://ehjudngdvilwvrukcxle.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_APP_TITLE=Quarter Master Inventory
   NODE_ENV=production
   ```

4. **Custom Domain (Optional)**
   - Add your domain in Vercel dashboard
   - Configure DNS records

### Option 2: Netlify

**Steps:**

1. **Connect Repository**
   - Go to Netlify dashboard
   - Click "New site from Git"
   - Connect your repository

2. **Build Settings**
   ```
   Build command: npm run build
   Publish directory: dist
   ```

3. **Environment Variables**
   Add the same variables as Vercel

4. **SPA Routing**
   Create `public/_redirects`:
   ```
   /*    /index.html   200
   ```

### Option 3: Traditional Hosting

**Requirements:**
- Web server (Apache, Nginx, etc.)
- Node.js support (for building)
- SSL certificate

**Steps:**

1. **Build Application**
   ```bash
   npm run build
   ```

2. **Upload Files**
   - Upload `dist/` folder contents to web root
   - Configure server for SPA routing

3. **Nginx Configuration Example**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /path/to/dist;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       # Security headers
       add_header X-Frame-Options "SAMEORIGIN" always;
       add_header X-Content-Type-Options "nosniff" always;
       add_header X-XSS-Protection "1; mode=block" always;
   }
   ```

## 🔧 Environment Configuration

### Production Environment Variables

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://ehjudngdvilwvrukcxle.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Application Configuration
VITE_APP_TITLE=Quarter Master Inventory
VITE_APP_DESCRIPTION=Secure inventory management system

# Environment
NODE_ENV=production

# Optional: Analytics and monitoring
VITE_ENABLE_ANALYTICS=true
VITE_ANALYTICS_ID=your_analytics_id
```

### Security Best Practices

1. **Never expose sensitive keys**
   - Only use `VITE_` prefix for client-safe variables
   - Keep service role keys on server only

2. **Enable CORS properly**
   - Configure Supabase CORS for your domain
   - Restrict to production URLs only

3. **Use HTTPS everywhere**
   - Force SSL redirects
   - Secure cookie settings
   - HSTS headers

## 🎭 Domain and SSL Setup

### Custom Domain Configuration

1. **DNS Records**
   ```
   Type: A
   Name: @
   Value: [hosting_provider_ip]
   
   Type: CNAME  
   Name: www
   Value: your-domain.com
   ```

2. **SSL Certificate**
   - Most hosting providers offer free SSL (Let's Encrypt)
   - Ensure auto-renewal is enabled

3. **Redirects**
   - HTTP to HTTPS
   - www to non-www (or vice versa)

## 📊 Monitoring and Analytics

### Application Monitoring

1. **Error Tracking**
   ```bash
   npm install @sentry/react @sentry/tracing
   ```

2. **Performance Monitoring**
   - Core Web Vitals tracking
   - Bundle size monitoring
   - API response times

3. **User Analytics**
   - Google Analytics 4
   - User behavior tracking
   - Feature usage metrics

### Database Monitoring

1. **Supabase Metrics**
   - Query performance
   - Connection pooling
   - Storage usage

2. **Custom Logging**
   - Application errors
   - User actions
   - Security events

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Type check
      run: npm run type-check
    
    - name: Lint
      run: npm run lint
    
    - name: Build
      run: npm run build
      env:
        VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

## 🛡️ Post-Deployment Security

### 1. Security Headers

Ensure these headers are set:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
```

### 2. Supabase Security

1. **Review RLS Policies**
   - Test with different user roles
   - Ensure data isolation
   - Check edge cases

2. **API Rate Limiting**
   - Configure appropriate limits
   - Monitor for abuse
   - Set up alerts

3. **Backup Strategy**
   - Automated daily backups
   - Point-in-time recovery
   - Test restore procedures

## 📈 Performance Optimization

### 1. Frontend Optimization

- **Code Splitting**: Implemented via Vite
- **Lazy Loading**: Route-based code splitting
- **Image Optimization**: WebP format, proper sizing
- **Caching**: Service worker for static assets

### 2. Database Optimization

- **Query Optimization**: Use indexes, avoid N+1 queries
- **Connection Pooling**: Configured in Supabase
- **Data Archiving**: Archive old audit logs

### 3. CDN Configuration

- **Static Assets**: Serve from CDN
- **Cache Headers**: Proper cache control
- **Compression**: Gzip/Brotli enabled

## 🔍 Testing in Production

### 1. Smoke Tests

After deployment, verify:

```bash
# Basic functionality
- Login with test account
- Navigate to dashboard
- Create test receipt
- Upload document
- Check audit logs

# Performance
- Page load times < 3 seconds
- API responses < 1 second
- File uploads working

# Security  
- Role-based access enforced
- Unauthorized access blocked
- File uploads secure
```

### 2. Monitoring Setup

1. **Uptime Monitoring**
   - Pingdom, UptimeRobot, or similar
   - Check every 5 minutes
   - Alert on downtime

2. **Performance Monitoring**
   - Real User Monitoring (RUM)
   - Core Web Vitals tracking
   - Error rate monitoring

## 🚨 Incident Response

### 1. Emergency Contacts

```
Developer: [Your contact]
Supabase Support: support@supabase.com
Domain Registrar: [Provider support]
Hosting Provider: [Provider support]
```

### 2. Rollback Procedure

1. **Vercel**: Deploy previous version
2. **Netlify**: Rollback in dashboard
3. **Traditional**: Restore previous files

### 3. Common Issues

| Issue | Symptoms | Solution |
|-------|----------|----------|
| Database Connection | 500 errors, timeouts | Check Supabase status, connection limits |
| Authentication Failure | Login not working | Verify Supabase Auth config, JWT settings |
| File Upload Issues | Upload failures | Check storage policies, file size limits |
| Performance Degradation | Slow loading | Check CDN, database performance |

## ✅ Go-Live Checklist

Final checklist before announcing the system is live:

- [ ] Production build deployed successfully
- [ ] Custom domain configured with SSL
- [ ] Environment variables set correctly
- [ ] Database migrations applied
- [ ] RLS policies active and tested
- [ ] Authentication working for all roles
- [ ] File uploads functional
- [ ] Error monitoring configured
- [ ] Uptime monitoring active
- [ ] Backup procedures tested
- [ ] Documentation updated
- [ ] User training completed
- [ ] Support procedures established

---

🎉 **Congratulations!** Your Quarter Master Inventory Management System is now live and ready for production use!

Remember to monitor the system closely during the first few days and gather user feedback for continuous improvement.
