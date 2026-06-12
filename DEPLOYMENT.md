# ReciePro Deployment Guide

This guide walks you through deploying ReciePro using Supabase (Database), Render (Backend), and Vercel (Frontend).

---

## Prerequisites
1. Create accounts on:
   - [Supabase](https://supabase.com)
   - [Render](https://render.com)
   - [Vercel](https://vercel.com)
2. Install Git and connect to your GitHub account

---

## Step 1: Set Up Supabase (Database)
1. Go to Supabase → New Project
2. Enter project details:
   - Name: ReciePro
   - Database Password: Save this!
   - Region: Choose the closest to your users
3. Wait for project to provision (~2 mins)
4. Go to Project Settings → Database → Connection String
5. Copy the Connection String (URI format)

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
1. Go to Render → New + → Blueprint
2. Connect your GitHub repo
3. Use the `render.yaml` we created
4. Wait for deployment (~5-10 mins)
5. Once deployed, copy your Render backend URL (e.g., `https://reciepro-backend.onrender.com`)

---

## Step 4: Deploy Frontend to Vercel
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

## Step 5: Migrate Database
1. In Render, go to your backend service → Shell
2. Run:
   ```bash
   php artisan migrate
   ```

---

## Final Checks
- Frontend should be live on your Vercel URL
- Backend API should be accessible on Render
- Supabase should have all tables created

That's it! Your ReciePro system is now deployed! 🚀
