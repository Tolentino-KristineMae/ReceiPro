# ReciePro Deployment Guide

This guide walks you through deploying ReciePro using Supabase (Database), Render (Backend), and Vercel (Frontend).

---

## Prerequisites
1. Create accounts on:
   - [Render](https://render.com)
   - [Vercel](https://vercel.com)
2. Install Git and connect to your GitHub account

---

## Step 1: Supabase Database (Already Set Up!)
You already have your Supabase DB ready with these details:
- `DB_HOST`: `aws-1-ap-southeast-2.pooler.supabase.com`
- `DB_PORT`: `6543`
- `DB_DATABASE`: `postgres`
- `DB_USERNAME`: `postgres.lwdtqukafwqkxexvmcnp`
- `DB_PASSWORD`: `Ew@nk0!D1ko`

Save these details for later!

---

## Step 2: Prepare Git Repository
Run these commands in your project directory:

```bash
cd c:\xampp\htdocs\newnew
git init
git add .
git commit -m "Initial commit"
```

Then create a new repository on GitHub and push your code.

---

## Step 3: Deploy Backend to Render
1. Go to Render → New + → Web Service (not Blueprint, since we're using Supabase instead of Render's DB)
2. Connect your GitHub repo
3. Configure:
   - **Name**: reciepro-backend
   - **Root Directory**: backend
   - **Environment**: PHP
   - **Region**: Choose closest to you
   - **Plan**: Starter
4. **Build Command**:
   ```bash
   composer install --no-interaction --prefer-dist --optimize-autoloader
   npm install
   npm run build
   php artisan storage:link
   ```
5. **Start Command**: `php artisan serve --host 0.0.0.0 --port 10000`
6. Add these **Environment Variables**:
   - `APP_ENV`: `production`
   - `APP_DEBUG`: `false`
   - `APP_KEY`: Click "Generate" to auto-generate
   - `DB_CONNECTION`: `pgsql`
   - `DB_HOST`: `aws-1-ap-southeast-2.pooler.supabase.com`
   - `DB_PORT`: `6543`
   - `DB_DATABASE`: `postgres`
   - `DB_USERNAME`: `postgres.lwdtqukafwqkxexvmcnp`
   - `DB_PASSWORD`: `Ew@nk0!D1ko`
   - `CACHE_DRIVER`: `file`
   - `SESSION_DRIVER`: `file`
   - `QUEUE_CONNECTION`: `sync`
7. Click "Create Web Service" and wait for deployment (~5-10 mins)
8. Once deployed, copy your Render backend URL (e.g., `https://reciepro-backend.onrender.com`)

---

## Step 4: Run Database Migrations
1. In Render, go to your backend service → Shell
2. Run:
   ```bash
   php artisan migrate
   ```

---

## Step 5: Deploy Frontend to Vercel
1. Go to Vercel → New Project
2. Import your GitHub repo
3. Configure:
   - Project Name: reciepro
   - Root Directory: Leave as is
4. Add Environment Variable:
   - Key: `VITE_API_BASE_URL`
   - Value: Your Render backend URL (from Step 3)
5. Click Deploy!

---

## Final Checks
- Frontend should be live on your Vercel URL
- Backend API should be accessible on Render
- Supabase should have all tables created after running migrations

That's it! Your ReciePro system is now deployed! 🚀
