# Frontend-Backend Deployment Setup

## Issues Fixed ✅

1. **Frontend API URL** - Was hardcoded to a specific Render backend
2. **CORS Configuration** - Backend now supports dynamic origin configuration
3. **Environment Variables** - Both frontend and backend now use `.env` files

---

## Frontend Setup

### Development Environment (`.env`)
```env
VITE_API_BASE_URL=http://localhost:8080
```

### Production Environment (`.env.production`)
Update with your deployed backend URL:
```env
VITE_API_BASE_URL=https://your-backend-url.com
```

**Note:** The `.env` file should be ignored in `.gitignore` and not committed to git.

---

## Backend Setup

### Development Environment (`.env`)
```env
PORT=8080
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=your_secret_key
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password
```

### Production Environment (`.env` on deployed server)
```env
PORT=5000
DATABASE_URL=postgresql://prod_user:prod_password@prod-db:5432/prod_db
CORS_ORIGIN=https://your-frontend-url.com
JWT_SECRET=prod_secret_key
MAIL_USER=prod_email@gmail.com
MAIL_PASS=prod_app_password
```

---

## Deployment Checklist

### Before Deploying to Production

1. **Update Frontend `.env.production`:**
   - Replace `https://your-backend-url.com` with your actual backend URL
   - Example: `https://api.yourdomain.com` or `https://your-backend.onrender.com`

2. **Update Backend `.env` (on server):**
   - Set `CORS_ORIGIN` to your frontend URL
   - Example: `CORS_ORIGIN=https://your-frontend.vercel.app`
   - For multiple origins, use commas: `CORS_ORIGIN=https://frontend1.com,https://frontend2.com`
   - Update database, JWT secret, and email credentials

3. **Build Frontend for Production:**
   ```bash
   cd frontend
   npm run build
   ```

4. **Verify CORS Configuration:**
   - Frontend URL must match one of the `CORS_ORIGIN` values
   - Common issue: `https://` vs `http://` mismatch
   - Trailing slashes can also cause issues

---

## Common Deployment Issues

### Issue: "CORS Error" or "Request blocked"
**Cause:** Frontend URL not in backend's `CORS_ORIGIN`
**Fix:** Add frontend URL to backend's `.env` `CORS_ORIGIN`

### Issue: Frontend shows "cannot GET /"
**Cause:** Frontend not built, or wrong static file serving
**Fix:** Run `npm run build` and ensure built files are served

### Issue: API calls return 404
**Cause:** Frontend API URL doesn't match backend URL
**Fix:** Update frontend `.env.production` with correct backend URL

### Issue: No HTTPS certificate
**Cause:** Mixed content (HTTPS frontend calling HTTP API)
**Fix:** Ensure both frontend and backend use HTTPS in production

---

## Quick Deployment Guide

### For Vercel (Frontend) + Render (Backend):

**1. Deploy Backend to Render:**
   - Environment variables in Render dashboard:
     ```
     CORS_ORIGIN=https://your-frontend.vercel.app
     PORT=5000
     (other vars)
     ```

**2. Deploy Frontend to Vercel:**
   - Environment variable in Vercel dashboard:
     ```
     VITE_API_BASE_URL=https://your-backend.onrender.com
     ```
   - Or hardcode in `.env.production` before deployment

**3. Test the Connection:**
   - Open your frontend URL
   - Check browser Console (F12) for any API errors
   - Verify the API calls show the correct backend URL

---

## Files Modified

- ✅ `frontend/src/api/axios.js` - Now uses environment variables
- ✅ `frontend/.env` - Local development API URL
- ✅ `frontend/.env.production` - Production API URL
- ✅ `backend/index.js` - Dynamic CORS configuration
- ✅ `backend/.env.example` - Template for environment variables
