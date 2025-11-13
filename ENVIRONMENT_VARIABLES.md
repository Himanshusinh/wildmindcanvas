# Environment Variables for Canvas

## Required Environment Variables

Create a `.env.local` file in the root of the `wildmindcanvas` directory with the following:

```env
# API Gateway Base URL
# For local development (API Gateway on port 5001):
NEXT_PUBLIC_API_BASE_URL=http://localhost:5001

# For production:
# NEXT_PUBLIC_API_BASE_URL=https://api-gateway-services-wildmind.onrender.com
```

## Complete Environment Configuration

### For Local Development

Create `.env.local`:
```env
# API Gateway URL (Local)
NEXT_PUBLIC_API_BASE_URL=http://localhost:5001

# Node Environment
NODE_ENV=development

# Development Server Port
PORT=3001
```

### For Production

Create `.env.production`:
```env
# API Gateway URL (Production)
NEXT_PUBLIC_API_BASE_URL=https://api-gateway-services-wildmind.onrender.com

# Node Environment
NODE_ENV=production
```

## Environment Variables Reference

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Base URL for API Gateway | Yes | `https://api-gateway-services-wildmind.onrender.com` | `http://localhost:5001` |
| `NEXT_PUBLIC_API_URL` | Alternative API URL (fallback) | No | Same as `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:5001/api` |
| `NODE_ENV` | Node.js environment | No | `development` | `production` |
| `PORT` | Next.js dev server port | No | `3001` | `3001` |

## Setup Instructions

1. **Create `.env.local` file:**
   ```bash
   cd wildmindcanvas
   touch .env.local
   ```

2. **Add the API Gateway URL:**
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:5001
   ```

3. **Restart the Next.js dev server:**
   ```bash
   npm run dev
   ```

## Troubleshooting "Failed to fetch" Errors

### 1. Verify API Gateway is Running
```bash
# Test if API Gateway is accessible
curl http://localhost:5001/health
# or for production:
curl https://api-gateway-services-wildmind.onrender.com/health
```

### 2. Check Environment Variable
```bash
# In your terminal, verify the variable is set
echo $NEXT_PUBLIC_API_BASE_URL

# Or in browser console:
console.log(process.env.NEXT_PUBLIC_API_BASE_URL)
```

### 3. Restart Dev Server
After changing `.env.local`, you must restart the Next.js dev server:
```bash
# Stop the server (Ctrl+C) and restart
npm run dev
```

### 4. Check CORS Configuration
Ensure the API Gateway allows requests from your Canvas domain:
- Local: `http://localhost:3001`
- Production: `https://studio.wildmindai.com`

### 5. Check Browser Console
Open browser DevTools → Console to see detailed error messages:
- Network tab: Check if the request is being made
- Console tab: Look for CORS or network errors

### 6. Verify Authentication Cookie
- Open DevTools → Application → Cookies
- Check if `app_session` cookie exists
- For localhost, cookies may not be shared between ports

## Quick Fix for Local Development

If you're getting "Failed to fetch" in local development:

1. **Ensure API Gateway is running:**
   ```bash
   cd api-gateway-services-wildmind
   npm run dev
   ```

2. **Check the API Gateway port:**
   - Default is `5001`
   - Update `.env.local` if different

3. **Test the connection:**
   ```bash
   curl http://localhost:5001/api/auth/me
   ```

4. **If using production API (for testing):**
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://api-gateway-services-wildmind.onrender.com
   ```

## Notes

- All `NEXT_PUBLIC_*` variables are exposed to the browser
- `.env.local` is gitignored and should not be committed
- Restart the dev server after changing environment variables
- In production, set environment variables in your hosting platform (Vercel, etc.)

