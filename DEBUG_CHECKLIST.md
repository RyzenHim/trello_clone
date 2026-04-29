# Debugging Frontend-Backend Connection

## Quick Troubleshooting Checklist

### Step 1: Check Local Development Works
- [ ] Backend running: `cd backend && npm run dev` (should be on port 8080)
- [ ] Frontend running: `cd frontend && npm run dev` (should be on port 5173)
- [ ] Open browser DevTools (F12) → Network tab
- [ ] Try logging in or fetching data
- [ ] Check Network tab for API requests
- [ ] Verify requests show `http://localhost:8080` in URL

### Step 2: Verify Environment Variables Are Loaded
**Frontend:**
```javascript
// Add this to any component temporarily to debug
console.log("API BASE URL:", import.meta.env.VITE_API_BASE_URL);
```

**Backend:**
```javascript
// Add this to index.js temporarily to debug
console.log("CORS Origins:", allowedOrigins);
```

### Step 3: Test API Endpoints Directly
**For local testing:**
```bash
# In a terminal, test the health endpoint
curl http://localhost:8080/health

# Should return: {"ok":true}
```

**For deployed testing:**
```bash
# Test your deployed backend
curl https://your-backend-url.com/health
```

### Step 4: Check CORS Configuration
Open browser DevTools → Console tab, look for errors like:
```
Access to XMLHttpRequest at 'https://backend.com' from origin 'https://frontend.com' 
has been blocked by CORS policy
```

**Solution:** Add the frontend URL to backend's `.env` `CORS_ORIGIN`

---

## Common API Error Codes

| Code | Issue | Solution |
|------|-------|----------|
| **CORS Error** | Frontend URL not allowed | Update `CORS_ORIGIN` in backend `.env` |
| **404** | API endpoint not found | Check route spelling in backend |
| **401** | Missing auth token | Login first, verify token in localStorage |
| **500** | Server error | Check backend terminal logs for error details |
| **Network Error** | Can't reach backend | Verify backend is running and URL is correct |

---

## Verify Environment Files

### Frontend
- **Local:** `frontend/.env` should have `VITE_API_BASE_URL=http://localhost:8080`
- **Production:** `frontend/.env.production` should have your actual backend URL

### Backend  
- **Create:** `backend/.env` from `backend/.env.example`
- **Update:** Change values to match your environment

---

## Deployment Testing

### 1. After deploying frontend:
```javascript
// In browser console on deployed frontend
// Should show your production backend URL
console.log(import.meta.env.VITE_API_BASE_URL);
```

### 2. After deploying backend:
```bash
# Test the health endpoint
curl https://your-backend-url.com/health

# Should return: {"ok":true}
```

### 3. Test a real API call:
```javascript
// In browser console
fetch('https://your-backend-url.com/user/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ email: 'test@test.com', password: 'password' })
})
  .then(r => r.json())
  .then(d => console.log('Success:', d))
  .catch(e => console.log('Error:', e))
```

---

## Files to Check

1. **frontend/.env** - Should have correct local API URL
2. **frontend/.env.production** - Should have correct production API URL  
3. **frontend/src/api/axios.js** - Should use `import.meta.env.VITE_API_BASE_URL`
4. **backend/.env** - Should have correct CORS_ORIGIN value
5. **backend/index.js** - Should read from `process.env.CORS_ORIGIN`

---

## Need More Help?

Check the logs:
```bash
# Frontend (Vite console output)
npm run dev

# Backend
npm run dev
# Look for errors and CORS configuration logs
```

All API calls go through: `frontend/src/api/axios.js`
- Modify the `baseURL` there if environment variables aren't working
