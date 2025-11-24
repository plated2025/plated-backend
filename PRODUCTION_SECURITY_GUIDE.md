# 🔒 Production Security Setup Guide

## 📋 Table of Contents
1. [Generated Secrets](#generated-secrets)
2. [Production .env Setup](#production-env-setup)
3. [Security Checklist](#security-checklist)
4. [Deployment Configuration](#deployment-configuration)

---

## 🔐 Generated Secrets

**IMPORTANT:** These are your production secrets. **Save them securely and NEVER commit them to Git!**

### JWT Secret (128 characters)
```
JWT_SECRET=061f5d3200d779cd32d999c7f2f0775702830a7cfec9ffc71c4623f3d46fd0bc870733d089e9e5d9aede1601b34d742b6930003a957ec13aec4738e783cd1144
```

### Cookie Secret (128 characters)
```
COOKIE_SECRET=f3adcf12b4d98da350e56e31e25024e9ab951e13da0538f49914cbc0aa46403b0aba9801163a7a5a48ad63942e5b39dcc4d94104180fee5093dbcda8a0bc7a8c
```

### Encryption Key (64 characters)
```
ENCRYPTION_KEY=aa78739e091eaf860cbe44e145c67fede3f53cdfdda1fe70d2cad91307cdbe53
```

---

## 🌍 Production .env Setup

### Step 1: Copy Your Current Credentials
Your production `.env` should use these values from your current setup:

```env
# MongoDB - Your existing production database
MONGODB_URI=mongodb+srv://plated_database:KA2WfVV5MVNRwxXe@plated.otwjv6q.mongodb.net/plated

# Cloudinary - Your existing credentials
CLOUDINARY_CLOUD_NAME=dlfgdi4qd
CLOUDINARY_API_KEY=525722494376387
CLOUDINARY_API_SECRET=e4bU7PzLnJGf6rP18AAsnQ8mFAo

# Redis - Your existing Upstash Redis
REDIS_URL=redis://default:AYwVAAIncDFmM2YxOGY3MjQ1NTE0ZGFiYjA5ZTE3NzU5MTJhYmQ1MXAxMzU4NjE@fine-iguana-35861.upstash.io:6379

# Google OAuth - Your existing credentials
GOOGLE_CLIENT_ID=YOUR-GOOGLE-CLIENT-ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR-GOOGLE-CLIENT-SECRET

# Gemini AI - Your existing API key
GEMINI_API_KEY=AIzaSyA18F00H8pGMFCt3K-q1WyUJ90qyeAJueI
```

### Step 2: Update with Production URLs
Replace localhost URLs with your production domain:

```env
# Frontend URL - Your production domain
FRONTEND_URL=https://plated.cloud
CLIENT_URL=https://plated.cloud

# Google OAuth Callback - Production URL
GOOGLE_CALLBACK_URL=https://api.plated.cloud/api/auth/google/callback
```

### Step 3: Add Production Secrets
Use the generated secrets from above:

```env
# Production JWT Secret (use the generated one above)
JWT_SECRET=061f5d3200d779cd32d999c7f2f0775702830a7cfec9ffc71c4623f3d46fd0bc870733d089e9e5d9aede1601b34d742b6930003a957ec13aec4738e783cd1144
JWT_EXPIRE=7d

# Cookie Security
COOKIE_SECRET=f3adcf12b4d98da350e56e31e25024e9ab951e13da0538f49914cbc0aa46403b0aba9801163a7a5a48ad63942e5b39dcc4d94104180fee5093dbcda8a0bc7a8c
COOKIE_SECURE=true
COOKIE_HTTPONLY=true
COOKIE_SAMESITE=strict

# Encryption Key
ENCRYPTION_KEY=aa78739e091eaf860cbe44e145c67fede3f53cdfdda1fe70d2cad91307cdbe53
```

### Step 4: Complete Production .env File

```env
# ========================================
# PRODUCTION ENVIRONMENT VARIABLES
# ========================================

# Server Configuration
PORT=5000
NODE_ENV=production

# MongoDB Database
MONGODB_URI=mongodb+srv://plated_database:KA2WfVV5MVNRwxXe@plated.otwjv6q.mongodb.net/plated

# JWT Authentication - PRODUCTION SECRETS
JWT_SECRET=061f5d3200d779cd32d999c7f2f0775702830a7cfec9ffc71c4623f3d46fd0bc870733d089e9e5d9aede1601b34d742b6930003a957ec13aec4738e783cd1144
JWT_EXPIRE=7d

# Frontend URL
FRONTEND_URL=https://plated.cloud
CLIENT_URL=https://plated.cloud

# Rate Limiting - Stricter for production
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=50

# Cookie Security
COOKIE_SECRET=f3adcf12b4d98da350e56e31e25024e9ab951e13da0538f49914cbc0aa46403b0aba9801163a7a5a48ad63942e5b39dcc4d94104180fee5093dbcda8a0bc7a8c
COOKIE_SECURE=true
COOKIE_HTTPONLY=true
COOKIE_SAMESITE=strict

# Cloudinary (Image/Video Uploads)
CLOUDINARY_CLOUD_NAME=dlfgdi4qd
CLOUDINARY_API_KEY=525722494376387
CLOUDINARY_API_SECRET=e4bU7PzLnJGf6rP18AAsnQ8mFAo

# Redis Cache
REDIS_URL=redis://default:AYwVAAIncDFmM2YxOGY3MjQ1NTE0ZGFiYjA5ZTE3NzU5MTJhYmQ1MXAxMzU4NjE@fine-iguana-35861.upstash.io:6379

# Google OAuth - Production (use your real credentials from .env)
GOOGLE_CLIENT_ID=YOUR-PRODUCTION-GOOGLE-CLIENT-ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR-PRODUCTION-GOOGLE-CLIENT-SECRET
GOOGLE_CALLBACK_URL=https://api.plated.cloud/api/auth/google/callback

# Google Gemini AI
GEMINI_API_KEY=AIzaSyA18F00H8pGMFCt3K-q1WyUJ90qyeAJueI

# Encryption
ENCRYPTION_KEY=aa78739e091eaf860cbe44e145c67fede3f53cdfdda1fe70d2cad91307cdbe53

# CORS
CORS_ORIGIN=https://plated.cloud
ALLOWED_ORIGINS=https://plated.cloud,https://www.plated.cloud

# Logging
LOG_LEVEL=info
```

---

## ✅ Security Checklist

### Before Deploying to Production:

- [ ] ✅ **Strong JWT Secret** - Using 128-character randomly generated secret
- [ ] ✅ **Strong Cookie Secret** - Using 128-character randomly generated secret
- [ ] ✅ **Encryption Key** - Using 64-character randomly generated key
- [ ] ✅ **NODE_ENV=production** - Set to production mode
- [ ] ✅ **Secure Cookies** - `COOKIE_SECURE=true` enabled
- [ ] ✅ **HttpOnly Cookies** - `COOKIE_HTTPONLY=true` enabled
- [ ] ✅ **CORS Configuration** - Only allow your production domain
- [ ] ✅ **Rate Limiting** - Configured and tested
- [ ] ✅ **HTTPS Only** - All URLs use HTTPS
- [ ] ✅ **Database Access** - IP whitelist configured on MongoDB Atlas
- [ ] ✅ **Environment Variables** - Never committed to Git
- [ ] ✅ **Google OAuth** - Production redirect URIs added to Google Console
- [ ] ✅ **Error Logging** - Sentry or similar configured (optional)
- [ ] ✅ **Backup Strategy** - Database backups enabled

### Google OAuth Setup:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services > Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add **Authorized redirect URIs**:
   - `https://api.plated.cloud/api/auth/google/callback`
5. Add **Authorized JavaScript origins**:
   - `https://plated.cloud`
   - `https://api.plated.cloud`

### MongoDB Atlas Production Setup:

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Select your cluster
3. Navigate to **Network Access**
4. Add IP whitelist:
   - Add your production server IP
   - Or use `0.0.0.0/0` (less secure but easier)
5. Navigate to **Database Access**
6. Create a production user with strong password
7. Update `MONGODB_URI` with production credentials

---

## 🚀 Deployment Configuration

### For Render.com:

1. Go to your backend service on Render
2. Navigate to **Environment**
3. Add each environment variable from your production .env
4. Click **Save Changes**
5. Service will automatically redeploy

### For Vercel/Netlify (Frontend):

Add this to your frontend environment variables:

```
VITE_API_URL=https://api.plated.cloud/api
```

---

## 📊 Security Comparison

| Setting | Development | Production |
|---------|------------|------------|
| **JWT_SECRET** | Simple string | 128-char random |
| **COOKIE_SECURE** | false | true (HTTPS only) |
| **CORS** | * (all origins) | Specific domain |
| **Rate Limiting** | 100 req/15min | 50 req/15min |
| **NODE_ENV** | development | production |
| **Logging** | verbose | info only |
| **Error Details** | Full stack trace | Generic messages |

---

## 🔑 Where to Store Production Secrets

### Option 1: Render.com Dashboard
- Add environment variables directly in Render dashboard
- Automatically encrypted and never visible after saving

### Option 2: Vercel Dashboard
- Add environment variables in Vercel project settings
- Can add different values for Production/Preview/Development

### Option 3: GitHub Secrets (for CI/CD)
- Repository Settings > Secrets > Actions
- Add secrets for automated deployments

---

## ⚠️ CRITICAL REMINDERS

1. **NEVER commit .env files to Git**
2. **Use different secrets for development and production**
3. **Rotate secrets if they are ever exposed**
4. **Use HTTPS only in production**
5. **Enable database backups**
6. **Monitor error logs regularly**
7. **Keep dependencies updated**

---

## 🆘 If Secrets Are Compromised

1. **Immediately** rotate all secrets (generate new ones)
2. Update MongoDB password
3. Regenerate OAuth credentials
4. Revoke old API keys
5. Update all environment variables
6. Force logout all users (if JWT secret changed)
7. Monitor for suspicious activity

---

## 📞 Support

If you need help with production security:
- MongoDB Atlas Support: support.mongodb.com
- Google OAuth Help: support.google.com/cloud
- Render Support: render.com/docs

---

**Last Updated:** November 24, 2025
