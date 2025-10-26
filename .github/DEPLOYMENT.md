# GitHub Actions Deployment Guide

This repository uses GitHub Actions for automated CI/CD to deploy to Cloudflare.

## 📋 Overview

We have 4 main workflows:

1. **CI** (`ci.yml`) - Runs on all PRs and pushes
   - Linting
   - Type checking
   - Format checking
   - (Tests when implemented)

2. **Deploy API v2** (`deploy-api.yml`) - Deploys backend API
3. **Deploy Webhook Proxy** (`deploy-webhook-proxy.yml`) - Deploys webhook proxy
4. **Deploy Frontend** (`deploy-frontend.yml`) - Deploys React SPA

## 🔐 Required GitHub Secrets

Go to your repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### Required Secrets:

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `CLOUDFLARE_API_TOKEN` | API token for Cloudflare | See instructions below |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | See instructions below |
| `VITE_API_URL` | Production API URL for frontend | `https://api-v2.dweinsteint.workers.dev` |

### Getting Cloudflare Credentials

#### 1. Get your Account ID

**Option A - From Dashboard:**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click on "Workers & Pages" in the left sidebar
3. Your Account ID is shown in the right sidebar

**Option B - From wrangler:**
```bash
pnpm --filter api-v2 exec wrangler whoami
```

Your Account ID is: `776b3be3bc7908baf073d7cce212c74f`

#### 2. Create API Token

1. Go to [API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **"Create Token"**
3. Use the **"Edit Cloudflare Workers"** template
4. **Add additional permissions:**
   - Account → Cloudflare Pages → Edit
   - Account → D1 → Edit
   - Account → R2 → Edit
5. (Optional) Restrict to specific account
6. Click **"Continue to summary"** → **"Create Token"**
7. **Copy the token** (you won't see it again!)
8. Add to GitHub Secrets as `CLOUDFLARE_API_TOKEN`

## 🚀 How Deployments Work

### Automatic Deployments (on push to `main`)

Deployments are **path-based**. Only the changed apps will deploy:

- Changes to `apps/api-v2/**` → Deploy API only
- Changes to `apps/webhook-proxy/**` → Deploy Webhook Proxy only
- Changes to `apps/teacher-client/**` → Deploy Frontend only
- Changes to `packages/**` → Deploy all affected apps
- Changes to `pnpm-lock.yaml` → Deploy all apps

### Manual Deployments

You can manually trigger any deployment:

1. Go to **Actions** tab
2. Select the workflow (e.g., "Deploy API v2")
3. Click **"Run workflow"**
4. Choose the branch
5. Click **"Run workflow"**

## 🎯 Workflow Features

### ✅ Optimizations Included

- **Monorepo aware** - Uses Turborepo for efficient builds
- **Smart caching** - Caches pnpm store and Turbo cache
- **Path filtering** - Only deploys when relevant files change
- **Pre-deploy checks** - Runs lint & type-check before deploying
- **Deployment summaries** - Shows deployment URLs in GitHub UI
- **Environment URLs** - Each workflow has an environment with live URL

### 🔄 Concurrency Control

The CI workflow has concurrency control:
- Only one CI run per branch at a time
- Newer pushes cancel old runs
- Saves GitHub Actions minutes

## 🛠️ Local Testing

Before pushing, you can test locally:

```bash
# Install dependencies
pnpm install

# Run linting (what CI runs)
pnpm lint

# Run type checking (what CI runs)
pnpm check-types

# Format check
pnpm exec prettier --check "**/*.{ts,tsx,md,json}"

# Build specific app
pnpm --filter api-v2 build
pnpm --filter teacher-client build

# Deploy manually
pnpm --filter api-v2 exec wrangler deploy --minify
pnpm --filter webhook-proxy exec wrangler deploy --minify
pnpm --filter teacher-client exec wrangler pages deploy dist --project-name=teacher-client
```

## 📦 Monorepo Structure

```
skyward-hackathon/
├── .github/workflows/     # GitHub Actions workflows
├── apps/
│   ├── api-v2/           # Backend API (Cloudflare Worker)
│   ├── webhook-proxy/    # Webhook proxy (Cloudflare Worker)
│   └── teacher-client/   # Frontend SPA (Cloudflare Pages)
├── packages/
│   ├── config-eslint/    # Shared ESLint config
│   └── config-typescript/ # Shared TypeScript config
├── .nvmrc                # Node version (20.18.0)
└── turbo.json            # Turborepo config
```

## 🔍 Troubleshooting

### Deployment fails with "Not logged in"

The GitHub Action uses API tokens, not OAuth. Make sure `CLOUDFLARE_API_TOKEN` is set correctly.

### Deployment fails with "Missing binding"

For `api-v2`, ensure:
- D1 database `eduguard-db` exists
- R2 bucket `eduguard-photos` exists

Create them manually:
```bash
pnpm --filter api-v2 exec wrangler d1 create eduguard-db
pnpm --filter api-v2 exec wrangler r2 bucket create eduguard-photos
```

### Lint/Type-check fails

Run locally to see the errors:
```bash
pnpm lint
pnpm check-types
```

Fix the errors and commit.

### Pages deployment fails

Ensure the Cloudflare Pages project exists:
```bash
# Create the project first time
pnpm --filter teacher-client exec wrangler pages project create teacher-client
```

## 🎨 Best Practices

1. **Always create feature branches** from `main`
2. **Open Pull Requests** for review - CI runs automatically
3. **Check CI status** before merging
4. **Merge to main** triggers production deployments
5. **Monitor deployments** in GitHub Actions tab
6. **Check Cloudflare logs** if deployment succeeds but app fails

## 📚 Additional Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Turborepo Docs](https://turbo.build/repo/docs)

## 🆘 Support

If you encounter issues:
1. Check the workflow logs in GitHub Actions
2. Check Cloudflare Worker/Pages logs in dashboard
3. Run commands locally to reproduce
4. Check this documentation for troubleshooting steps

