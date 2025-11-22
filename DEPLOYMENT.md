# Deployment Guide

This guide will help you deploy your Ensura application with the frontend on Vercel and the backend on Railway or Render.

## Architecture

- **Frontend**: Next.js app deployed to Vercel
- **Backend**: Express API deployed to Railway/Render
- **Database**: PostgreSQL hosted on Railway/Render

## Prerequisites

- GitHub account
- Vercel account (free tier available)
- Railway or Render account (free tier available)

---

## Step 1: Deploy Backend to Railway

### 1.1 Create PostgreSQL Database

1. Go to [Railway](https://railway.app) and create a new project
2. Click "New" → "Database" → "Add PostgreSQL"
3. Note down the connection details:
   - `DB_HOST` (e.g., `containers-us-west-xxx.railway.app`)
   - `DB_PORT` (usually `5432`)
   - `DB_NAME` 
   - `DB_USER`
   - `DB_PASSWORD`

### 1.2 Deploy Backend Service

1. In the same Railway project, click "New" → "GitHub Repo"
2. Select your `ensura` repository
3. Railway will auto-detect the monorepo structure
4. Configure the service:
   - **Root Directory**: `0g-compute-ts-starter-kit`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`

### 1.3 Set Environment Variables

In Railway, add these environment variables:

```
PRIVATE_KEY=your_private_key_here
PORT=4000
NODE_ENV=production
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
DB_HOST=<from_postgresql_service>
DB_PORT=5432
DB_NAME=<from_postgresql_service>
DB_USER=<from_postgresql_service>
DB_PASSWORD=<from_postgresql_service>
```

### 1.4 Get Backend URL

Once deployed, Railway will provide a URL like:
```
https://your-backend-xxx.up.railway.app
```

**Important**: Save this URL for the frontend deployment!

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Connect GitHub Repository

1. Go to [Vercel](https://vercel.com)
2. Click "New Project"
3. Import your `ensura` repository
4. Vercel will auto-detect Next.js

### 2.2 Configure Project Settings

- **Framework Preset**: Next.js
- **Root Directory**: `.` (project root)
- **Build Command**: `npm run build` (already configured in vercel.json)
- **Output Directory**: `frontend/.next` (already configured in vercel.json)
- **Install Command**: `npm install` (already configured in vercel.json)

### 2.3 Set Environment Variables

Add this environment variable in Vercel:

```
NEXT_PUBLIC_API_URL=https://your-backend-xxx.up.railway.app
```

Replace with your actual Railway backend URL from Step 1.4.

### 2.4 Deploy

Click "Deploy" and wait for the build to complete.

---

## Step 3: Update CORS Settings

After your frontend is deployed, you'll get a Vercel URL like:
```
https://your-app.vercel.app
```

### Update Backend Environment Variables

Go back to Railway and update the `ALLOWED_ORIGINS` variable:

```
ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-custom-domain.com
```

You can add multiple origins separated by commas.

---

## Step 4: Test the Deployment

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Try submitting a query through the form
3. Check that the frontend can successfully communicate with the backend

---

## Alternative: Deploy Backend to Render

If you prefer Render over Railway:

1. Go to [Render](https://render.com)
2. Create a new PostgreSQL database
3. Create a new Web Service
4. Connect your GitHub repository
5. Configure:
   - **Root Directory**: `0g-compute-ts-starter-kit`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
6. Add the same environment variables as above
7. Follow the same steps for CORS configuration

---

## Local Development

For local development, the setup remains the same:

```bash
# Install dependencies
npm install

# Start backend (in one terminal)
cd 0g-compute-ts-starter-kit
npm run dev

# Start frontend (in another terminal)
cd frontend
npm run dev
```

The frontend will use `http://localhost:4000` as configured in `frontend/.env.local`.

---

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:
1. Check that `ALLOWED_ORIGINS` in your backend includes your Vercel domain
2. Ensure there are no trailing slashes in the URLs
3. Redeploy the backend after updating environment variables

### API Connection Issues

If the frontend can't connect to the backend:
1. Verify `NEXT_PUBLIC_API_URL` is set correctly in Vercel
2. Check that your backend is running (visit the Railway/Render URL)
3. Check browser network tab for the actual error

### Build Failures

If the build fails:
1. Check the build logs in Vercel/Railway
2. Ensure all dependencies are in `package.json`
3. Verify TypeScript compiles locally: `npm run build`

---

## Environment Variables Summary

### Frontend (.env.local / Vercel)
```
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

### Backend (.env / Railway/Render)
```
PRIVATE_KEY=your_private_key
PORT=4000
NODE_ENV=production
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
```

---

## Security Notes

1. Never commit `.env` files to Git (they're already in `.gitignore`)
2. Use `.env.example` files as templates
3. Rotate your `PRIVATE_KEY` regularly
4. Restrict `ALLOWED_ORIGINS` to only your domains (don't use `*` in production)
5. Use strong database passwords

---

## Custom Domains

### Vercel (Frontend)
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update backend `ALLOWED_ORIGINS` to include the new domain

### Railway/Render (Backend)
1. Go to Service Settings → Networking/Custom Domain
2. Add your custom domain
3. Update DNS records
4. Update frontend `NEXT_PUBLIC_API_URL` to use the new domain

---

## Support

If you encounter issues:
1. Check the deployment logs on Vercel/Railway
2. Review browser console for errors
3. Verify all environment variables are set correctly
4. Ensure your database is accessible from the backend service
