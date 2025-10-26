# 🚀 GitHub Actions Setup Checklist

Follow these steps to enable automated deployments for this repository.

## ✅ Step 1: Set Up GitHub Secrets

Go to: **Your Repo** → **Settings** → **Secrets and variables** → **Actions**

### Create these secrets:

- [ ] **CLOUDFLARE_API_TOKEN**

  ```
  Value: <your-cloudflare-api-token>
  ```

  👉 [Create token here](https://dash.cloudflare.com/profile/api-tokens)
  - Use template: "Edit Cloudflare Workers"
  - Add permissions: Cloudflare Pages (Edit), D1 (Edit), R2 (Edit)

- [ ] **CLOUDFLARE_ACCOUNT_ID**

  ```
  Value: 776b3be3bc7908baf073d7cce212c74f
  ```

- [ ] **VITE_API_URL**
  ```
  Value: https://api-v2.dweinsteint.workers.dev
  ```

## ✅ Step 2: Create Cloudflare Pages Project (First Time Only)

Run this locally to create the Pages project:

```bash
cd apps/teacher-client
pnpm build
pnpm exec wrangler pages project create eduguard
```

Or create it via the Cloudflare Dashboard:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click **"Workers & Pages"**
3. Click **"Create"** → **"Pages"** → **"Upload assets"**
4. Name: `eduguard`

## ✅ Step 3: Verify Resources Exist

Make sure these resources exist in Cloudflare:

- [ ] D1 Database: `eduguard-db`

  ```bash
  pnpm --filter api-v2 exec wrangler d1 list
  ```

- [ ] R2 Bucket: `eduguard-photos`

  ```bash
  pnpm --filter api-v2 exec wrangler r2 bucket list
  ```

- [ ] Worker: `api-v2` (deployed)

  ```bash
  curl https://api-v2.dweinsteint.workers.dev
  ```

- [ ] Worker: `webhook-proxy` (deployed)
  ```bash
  curl https://webhook-proxy.dweinsteint.workers.dev
  ```

## ✅ Step 4: Enable GitHub Actions

- [ ] GitHub Actions should be enabled by default
- [ ] Check: **Settings** → **Actions** → **General**
- [ ] Ensure "Allow all actions and reusable workflows" is selected

## ✅ Step 5: Test the Workflows

### Option A: Make a test commit

```bash
# Make a small change
echo "# Test" >> apps/api-v2/README.md
git add .
git commit -m "test: trigger CI"
git push
```

Then check: **Actions** tab in GitHub

### Option B: Manual trigger

1. Go to **Actions** tab
2. Select "Deploy API v2"
3. Click **"Run workflow"**
4. Select branch `main`
5. Click **"Run workflow"**

## ✅ Step 6: Verify Deployments

After workflows run successfully:

- [ ] Check API: https://api-v2.dweinsteint.workers.dev
- [ ] Check Webhook Proxy: https://webhook-proxy.dweinsteint.workers.dev
- [ ] Check Frontend: https://eduguard.pages.dev (or custom domain)

## 🎉 You're All Set!

From now on:

- Every PR → Runs CI (lint, type-check, format)
- Every push to `main` → Deploys changed apps automatically
- Manual deployments available via "Run workflow" button

## 📋 Quick Reference

### Run CI checks locally:

```bash
pnpm lint
pnpm check-types
pnpm exec prettier --check "**/*.{ts,tsx,md,json}"
```

### Deploy manually:

```bash
# API
pnpm --filter api-v2 exec wrangler deploy --minify

# Webhook Proxy
pnpm --filter webhook-proxy exec wrangler deploy --minify

# Frontend
cd apps/teacher-client && pnpm build
pnpm exec wrangler pages deploy dist --project-name=eduguard
```

### View logs:

```bash
# Real-time logs
pnpm --filter api-v2 exec wrangler tail
pnpm --filter webhook-proxy exec wrangler tail

# Or view in Cloudflare Dashboard
```

---

**Need help?** See [DEPLOYMENT.md](.github/DEPLOYMENT.md) for full documentation.
