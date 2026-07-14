# Supabase Setup Guide

This guide will help you set up Supabase to enable real-time sync between your phone and Mac.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Fill in:
   - **Name**: `arc-research` (or any name you prefer)
   - **Database Password**: Choose a strong password
   - **Region**: Select the closest region to you
4. Click "Create new project" and wait ~2 minutes for setup

## 2. Run the Database Schema

1. In your Supabase project, go to the **SQL Editor** (left sidebar)
2. Click "New Query"
3. Copy the entire contents of `supabase-schema.sql` from this repo
4. Paste it into the SQL editor
5. Click "Run" to execute

This creates:
- `profiles` table for user data
- `projects` table for research projects  
- `citations` table for sources
- Row Level Security policies (your data is private!)
- Automatic triggers for timestamps

## 3. Get Your API Keys

1. Go to **Settings** → **API** (left sidebar)
2. You'll see two keys:
   - **Project URL**: Something like `https://xxxxxxxxxxxxx.supabase.co`
   - **anon/public key**: A long string starting with `eyJ...`

## 4. Configure Your App

### For Local Development / Mac App:

1. In the project root, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your keys:
   ```
   VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. Restart your app (`npm run dev`)

### For GitHub Pages / Deployed Version:

1. Go to your GitHub repository settings
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click "New repository secret"
4. Add these two secrets:
   - Name: `VITE_SUPABASE_URL`, Value: your Project URL
   - Name: `VITE_SUPABASE_ANON_KEY`, Value: your anon key

5. Update the GitHub Actions workflow to use these secrets (if needed)

## 5. Enable Authentication

1. In Supabase, go to **Authentication** → **Providers**
2. Enable "Email" provider
3. Optionally configure:
   - Email templates (customize the look)
   - Redirect URLs (add your deployment URL)

## 6. Test It Out!

### On Mac:
1. Open the app
2. Click the cloud icon in the header
3. Sign up with your email
4. Create a research project and add some citations

### On Phone:
1. Open the deployed app (GitHub Pages URL)
2. Install as PWA (Add to Home Screen)
3. Sign in with the same email
4. You should see your data sync instantly! ✨

## Features You Get:

✅ **Real-time sync** - Changes appear instantly on all devices  
✅ **Offline support** - Work without internet, syncs when online  
✅ **Secure** - Row Level Security ensures your data is private  
✅ **Automatic backups** - Supabase handles all database backups  
✅ **Cross-device** - Access from phone, Mac, web, anywhere!

## Troubleshooting:

**"Supabase not configured" message:**
- Make sure your `.env` file has both variables
- Restart the app after adding environment variables
- Check that the values are correct (no quotes in .env file)

**Not syncing:**
- Check browser console for errors
- Verify you're signed in (cloud icon should be blue)
- Make sure Row Level Security policies are set up correctly

**Sign up not working:**
- Check Supabase Authentication settings
- Verify email provider is enabled
- Check spam folder for confirmation email

## Optional: Custom Domain

Want `research.yourdomain.com` instead of the GitHub Pages URL?

1. Add a custom domain in GitHub Pages settings
2. Update Supabase Authentication redirect URLs to include your domain
3. Done!

---

Need help? Check the [Supabase docs](https://supabase.com/docs) or file an issue!
