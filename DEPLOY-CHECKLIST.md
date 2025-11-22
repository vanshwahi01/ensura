# 🚀 Deployment Checklist

Follow these steps in order to deploy your application.

---

## ✅ Step 1: Deploy Backend to Railway

### 1. Create Railway Account & Project
- [ ] Go to https://railway.app
- [ ] Sign in with GitHub
- [ ] Click "New Project"

### 2. Add PostgreSQL Database
- [ ] Click "New" → "Database" → "Add PostgreSQL"
- [ ] Wait for database to provision
- [ ] Click on PostgreSQL service
- [ ] Go to "Variables" tab
- [ ] **SAVE THESE VALUES** (you'll need them):
  ```
  PGHOST=
  PGPORT=
  PGDATABASE=
  PGUSER=
  PGPASSWORD=
  ```

### 3. Deploy Backend Service
- [ ] In same project, click "New" → "GitHub Repo"
- [ ] Select your `ensura` repository
- [ ] Railway will start deploying

### 4. Configure Backend Service
- [ ] Click on the backend service
- [ ] Go to "Settings" tab
- [ ] Set **Root Directory**: `0g-compute-ts-starter-kit`
- [ ] Set **Build Command**: `npm run build`
- [ ] Set **Start Command**: `npm run start`

### 5. Add Environment Variables
- [ ] Go to "Variables" tab
- [ ] Click "Raw Editor"
- [ ] Paste this (fill in your values):
  ```
  PRIVATE_KEY=1d09ce09ceee3dbf913f0d2832b9f55f5ba652ccdc5bb2784a061eDB47165Dd
  PORT=4000
  NODE_ENV=production
  ALLOWED_ORIGINS=http://localhost:3000
  DB_HOST=<from_postgresql_PGHOST>
  DB_PORT=<from_postgresql_PGPORT>
  DB_NAME=<from_postgresql_PGDATABASE>
  DB_USER=<from_postgresql_PGUSER>
  DB_PASSWORD=<from_postgresql_PGPASSWORD>
  ```
- [ ] Click "Update Variables"

### 6. Get Backend URL
- [ ] Go to "Settings" tab
- [ ] Click "Generate Domain" under "Networking"
- [ ] **SAVE THIS URL**: `https://____________.up.railway.app`
- [ ] Test it by visiting: `https://your-url.up.railway.app` (should show API info)

---

## ✅ Step 2: Deploy Frontend to Vercel

### 1. Create Vercel Account
- [ ] Go to https://vercel.com
- [ ] Sign in with GitHub

### 2. Import Project
- [ ] Click "Add New..." → "Project"
- [ ] Find and select `ensura` repository
- [ ] Click "Import"

### 3. Configure Build Settings
Vercel should auto-detect everything, but verify:
- [ ] **Framework Preset**: Next.js
- [ ] **Root Directory**: `.` (leave as project root)
- [ ] **Build Command**: `npm run build` (auto-configured)
- [ ] **Output Directory**: `frontend/.next` (auto-configured)

### 4. Add Environment Variables
- [ ] Before deploying, click "Environment Variables"
- [ ] Add variable:
  - **Name**: `NEXT_PUBLIC_API_URL`
  - **Value**: `https://your-backend-url.up.railway.app` (from Step 1.6)
- [ ] Click "Add"

### 5. Deploy
- [ ] Click "Deploy"
- [ ] Wait for build to complete (2-3 minutes)
- [ ] **SAVE YOUR VERCEL URL**: `https://____________.vercel.app`

---

## ✅ Step 3: Update CORS Settings

### 1. Add Vercel URL to Backend
- [ ] Go back to Railway
- [ ] Click on your backend service
- [ ] Go to "Variables" tab
- [ ] Find `ALLOWED_ORIGINS`
- [ ] Update it to: `https://your-app.vercel.app` (from Step 2.5)
- [ ] If you have multiple domains, separate with commas:
  ```
  ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-custom-domain.com
  ```

### 2. Redeploy Backend
- [ ] Backend should auto-redeploy with new variables
- [ ] Or click "Deploy" button to force redeploy

---

## ✅ Step 4: Test Your Deployment

### 1. Test Frontend
- [ ] Visit your Vercel URL: `https://your-app.vercel.app`
- [ ] Page should load without errors
- [ ] Check browser console (F12) for any errors

### 2. Test Backend Connection
- [ ] On your Vercel site, fill out the form
- [ ] Submit a query
- [ ] Wait for the loading animation
- [ ] Verify you get a response

### 3. If You See Errors
- **CORS Error**: Double-check `ALLOWED_ORIGINS` includes your Vercel URL
- **API Error**: Verify `NEXT_PUBLIC_API_URL` is set correctly in Vercel
- **500 Error**: Check Railway logs (click on service → "Deployments" → latest deployment → "View Logs")
- **Database Error**: Verify all `DB_*` variables are set correctly

---

## 📝 URLs to Save

Fill these in as you deploy:

```
Backend URL (Railway):  https://_________________.up.railway.app
Frontend URL (Vercel):  https://_________________.vercel.app
Database URL (Railway): postgres://___________________________
```

---

## 🎉 You're Done!

Once all steps are complete:
- ✅ Backend is running on Railway with PostgreSQL
- ✅ Frontend is deployed on Vercel
- ✅ CORS is configured correctly
- ✅ Environment variables are set
- ✅ Application is live and working!

---

## 🆘 Need Help?

1. Check `DEPLOYMENT.md` for detailed instructions
2. Railway Logs: Service → Deployments → View Logs
3. Vercel Logs: Project → Deployments → Click deployment → View Function Logs
4. Browser Console: F12 → Console tab

---

## 🔄 Future Updates

When you push changes to GitHub:
- **Railway**: Auto-deploys from `dev` branch
- **Vercel**: Auto-deploys from `dev` branch

Just push to GitHub and both services will update automatically!
