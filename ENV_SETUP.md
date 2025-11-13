# Environment Variables Setup for Canvas

## Quick Start

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Update `.env.local` with your configuration:**
   - For local development: Use `http://localhost:5001` for API
   - For production: Use `https://api-gateway-services-wildmind.onrender.com`

## Required Environment Variables

### `NEXT_PUBLIC_API_BASE_URL`
- **Description**: Base URL for the API Gateway
- **Production**: `https://api-gateway-services-wildmind.onrender.com`
- **Development**: `http://localhost:5001`
- **Required**: Yes
- **Usage**: Used for all API calls (auth, generation, canvas operations)

### Optional Environment Variables

### `NEXT_PUBLIC_API_URL` (Fallback)
- **Description**: Alternative API URL (used as fallback if `NEXT_PUBLIC_API_BASE_URL` is not set)
- **Default**: Same as `NEXT_PUBLIC_API_BASE_URL`
- **Required**: No

### `NODE_ENV`
- **Description**: Node.js environment
- **Options**: `development`, `production`, `test`
- **Default**: `development`
- **Required**: No

### `PORT`
- **Description**: Port for Next.js development server
- **Default**: `3001`
- **Required**: No

### `NEXT_PUBLIC_CANVAS_URL`
- **Description**: Canvas application URL (for redirects and links)
- **Production**: `https://studio.wildmindai.com`
- **Development**: `http://localhost:3001`
- **Required**: No

### `NEXT_PUBLIC_WILDMIND_URL`
- **Description**: Main WildMind project URL (for redirects to login/signup)
- **Production**: `https://wildmindai.com`
- **Development**: `http://localhost:3000`
- **Required**: No

## Environment-Specific Configurations

### Local Development
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5001
NODE_ENV=development
PORT=3001
NEXT_PUBLIC_CANVAS_URL=http://localhost:3001
NEXT_PUBLIC_WILDMIND_URL=http://localhost:3000
```

### Production
```env
NEXT_PUBLIC_API_BASE_URL=https://api-gateway-services-wildmind.onrender.com
NODE_ENV=production
NEXT_PUBLIC_CANVAS_URL=https://studio.wildmindai.com
NEXT_PUBLIC_WILDMIND_URL=https://wildmindai.com
```

## Troubleshooting "Failed to fetch" Errors

### 1. Check API Gateway is Running
- **Local**: Ensure API Gateway is running on port 5001
- **Production**: Verify the API Gateway URL is accessible

### 2. Check CORS Configuration
- Ensure the API Gateway allows requests from your Canvas domain
- For localhost:3001, ensure `http://localhost:3001` is in allowed origins

### 3. Check Environment Variables
- Verify `NEXT_PUBLIC_API_BASE_URL` is set correctly
- Restart the Next.js dev server after changing `.env.local`

### 4. Check Network Connectivity
- Test the API URL directly: `curl https://api-gateway-services-wildmind.onrender.com/health`
- Check browser console for CORS errors

### 5. Check Authentication
- Ensure you're logged in on the main WildMind project
- Check that `app_session` cookie is being set (in browser DevTools)

## File Priority

Next.js loads environment variables in this order:
1. `.env.local` (highest priority, should be gitignored)
2. `.env.development` or `.env.production` (based on NODE_ENV)
3. `.env` (lowest priority)

## Security Notes

- **Never commit `.env.local`** to version control
- All `NEXT_PUBLIC_*` variables are exposed to the browser
- Don't put sensitive secrets in `NEXT_PUBLIC_*` variables

