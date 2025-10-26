# ✅ Cloudflare Containers Setup - COMPLETE

## What Was Configured

Your AI Agents service is now **fully configured for Cloudflare Containers deployment**! 🎉

### Architecture

```
┌─────────────────────────────────────────────────────┐
│  Cloudflare Worker (worker.ts)                      │
│  - Routes requests to containers                    │
│  - Manages Durable Object instances                 │
└───────────────┬─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────┐
│  Durable Object (AIAgentsContainer)                 │
│  - Manages container lifecycle                      │
│  - Handles start/stop/error events                  │
│  - Proxies requests to container                    │
└───────────────┬─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────┐
│  Docker Container (Node.js 22 + Alpine)             │
│  - Full Node.js runtime                             │
│  - Hono server on port 3001                         │
│  - Vercel AI SDK + GPT-4                            │
│  - ElevenLabs SDK                                   │
│  - All your routes: /api/reasoning, /api/voice      │
└─────────────────────────────────────────────────────┘
```

### Files Created/Modified

1. **`src/worker.ts`** ⭐ NEW
   - Cloudflare Worker that routes to containers
   - Defines `AIAgentsContainer` Durable Object
   - Extends `@cloudflare/containers` Container class
   - TypeScript types for environment bindings

2. **`wrangler.jsonc`** ✏️ UPDATED
   - Container configuration (`containers` section)
   - Durable Object bindings
   - Migrations for SQLite-backed Durable Objects
   - Points to `src/worker.ts` as main entry

3. **`Dockerfile`** ✅ READY
   - Multi-stage build for pnpm workspace
   - Production-ready Node.js 22 Alpine image
   - Non-root user, health checks
   - Exposes port 3001

4. **`package.json`** ✏️ UPDATED
   - Added `@cloudflare/containers` dependency
   - New deploy script: `pnpm deploy`
   - Container management scripts
   - Added `@cloudflare/workers-types` for TypeScript

5. **`.github/workflows/deploy-ai-agents.yml`** ✏️ UPDATED
   - Deploys container to Cloudflare on push to main
   - Simplified wrangler command

6. **Documentation:**
   - `CLOUDFLARE_CONTAINERS_QUICKSTART.md` - Quick start guide
   - `CLOUDFLARE_CONTAINER_DEPLOYMENT.md` - Complete deployment guide
   - `DEPLOYMENT_COMPLETE.md` - Old summary (can delete)
   - `README.md` - Updated with deployment section

## How It Works

### 1. Request Flow

```
User Request
    ↓
Cloudflare Edge
    ↓
Worker (worker.ts)
    ↓
AIAgentsContainer Durable Object
    ↓
Docker Container (Node.js server)
    ↓
Hono Routes (/api/reasoning, /api/voice)
    ↓
Response
```

### 2. Container Lifecycle

- **Startup:** Container boots when first request arrives
- **Active:** Handles requests on port 3001
- **Idle:** After 10 minutes, container sleeps
- **Wakeup:** Next request wakes container (~1-2s cold start)
- **Shutdown:** Graceful shutdown on errors or replacements

### 3. Scaling

- **Max instances:** 5 containers (configured in wrangler.jsonc)
- **Auto-scaling:** Cloudflare starts containers on demand
- **Load balancing:** Currently uses single instance (`getByName`)
- **Can be changed:** Use `getRandom()` for multi-container load balancing

## Deployment Steps

### Step 1: Set Production Secrets

```bash
cd apps/ai-agents
bash scripts/set-production-secrets.sh
```

This sets 6 secrets in Cloudflare:
- `OPENAI_API_KEY`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_AGENT_ID`
- `ELEVENLABS_PHONE_NUMBER_ID`
- `CLOUDFLARE_API_URL`
- `SCHOOL_NAME`

### Step 2: Deploy

```bash
# From apps/ai-agents directory
pnpm deploy

# Or commit and push (triggers GitHub Actions)
git add .
git commit -m "🚀 deploy: AI Agents to Cloudflare Containers"
git push origin main
```

**First deploy takes 5-10 minutes:**
- Builds Docker image
- Pushes to Cloudflare Registry  
- Deploys Worker
- Provisions containers

**⚠️ Important:** After first deploy, wait 5-10 minutes before testing!

### Step 3: Verify Deployment

```bash
# Check container status
pnpm containers:list

# Should show:
# Name: ai-agents
# Status: healthy
# Class: AIAgentsContainer
# Instances: running

# View images
pnpm containers:images

# Test endpoints
curl https://ai-agents.YOUR_SUBDOMAIN.workers.dev/worker-health
curl https://ai-agents.YOUR_SUBDOMAIN.workers.dev/
```

### Step 4: Update api-v2

Update the AI Agents URL in api-v2:

```bash
cd ../api-v2
echo "https://ai-agents.YOUR_SUBDOMAIN.workers.dev" | pnpm wrangler secret put AI_AGENTS_URL
```

## Testing

### Local Development (Node.js Only)

```bash
pnpm dev
# Server runs on http://localhost:3001
```

### Local Docker Testing

```bash
# Build image
pnpm docker:build

# Run container
pnpm docker:test

# Test
curl http://localhost:3001/
```

### Production Testing

```bash
BASE_URL="https://ai-agents.YOUR_SUBDOMAIN.workers.dev"

# Worker health
curl $BASE_URL/worker-health

# Container health
curl $BASE_URL/

# Reasoning agent
curl -X POST $BASE_URL/api/reasoning/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "test-123",
    "student_name": "Sofia Martinez",
    "session_id": "session-456",
    "today_attendance": [
      {"period": 1, "status": "present", "confidence": 99.2},
      {"period": 2, "status": "absent"}
    ],
    "history_7d": []
  }'
```

## Monitoring

### View Logs

```bash
# Real-time logs from Worker and Container
pnpm wrangler tail

# Look for:
# - "🤖 AI Agents Container started successfully"
# - Request handling
# - Any errors
```

### Container Status

```bash
# List containers
pnpm containers:list

# List images
pnpm containers:images

# View in dashboard
# Visit: https://dash.cloudflare.com → Workers & Pages → Containers
```

### Metrics

Cloudflare Dashboard shows:
- Request count
- Error rate
- Container health
- Logs and traces

## Costs

### Cloudflare Containers
- **Base:** $5-10/month
- **Compute:** $0.50 per million requests
- **Storage:** Included for images

### External APIs
- **OpenAI GPT-4o-mini:** ~$15/month
- **ElevenLabs:** ~$300/month (voice calls)

### Total: ~$320-330/month

**ROI:** Teacher time saved = $125-250/day → Positive ROI in 3-5 days! 📈

## GitHub Actions

Auto-deploys on push to `main` when changes in:
- `apps/ai-agents/**`
- `packages/**`
- `pnpm-lock.yaml`

### Required Secrets

Add to GitHub → Settings → Secrets:

1. **`CLOUDFLARE_API_TOKEN`**
   - Create at: dash.cloudflare.com/profile/api-tokens
   - Template: "Edit Cloudflare Workers"
   - Permissions: Workers Scripts > Edit

2. **`CLOUDFLARE_ACCOUNT_ID`**
   - Find at: dash.cloudflare.com (in URL after /accounts/)

## Key Differences from Standard Workers

| Feature | Standard Worker | Container Worker |
|---------|----------------|------------------|
| Runtime | V8 isolate | Full Node.js |
| Node APIs | Limited | ✅ All available |
| npm packages | Most work | ✅ All work |
| Deployment | Source code | Docker image |
| Cold start | ~5ms | ~1-2 seconds |
| Max size | 1MB gzipped | 10MB+ |
| Use case | Stateless edge logic | Stateful services, AI SDKs |

## Troubleshooting

### "Container unavailable" after deploy

**Solution:** Wait 5-10 minutes. Containers need provisioning.

```bash
# Check status
pnpm containers:list

# View logs
pnpm wrangler tail
```

### Secrets not loading in container

Secrets are passed as environment variables automatically. Check:

```bash
# Verify secrets exist
pnpm wrangler secret list

# Should show all 6 secrets (values hidden)
```

### Build fails

```bash
# Test Docker build locally
pnpm docker:build

# Check for errors in Dockerfile
# Ensure Docker is running
docker ps
```

### Requests timing out

- Container may be sleeping (cold start)
- First request after idle takes 1-2 seconds
- Subsequent requests are fast

### Want to scale to multiple containers?

Update `worker.ts`:

```typescript
// Instead of:
const container = env.AI_AGENTS_CONTAINER.getByName('ai-agents-primary');

// Use random load balancing:
function getRandom(namespace: DurableObjectNamespace, max: number) {
  const id = Math.floor(Math.random() * max);
  return namespace.getByName(`container-${id}`);
}

const container = getRandom(env.AI_AGENTS_CONTAINER, 5);
```

## Next Steps

1. ✅ **Deploy:** Run `pnpm deploy`
2. ⏳ **Wait:** 5-10 minutes for provisioning
3. ✅ **Verify:** Check container status
4. ✅ **Test:** Hit your endpoints
5. ✅ **Update api-v2:** Set `AI_AGENTS_URL` secret
6. ✅ **Monitor:** Watch logs and metrics
7. 🎯 **Scale:** Adjust `max_instances` if needed

## Documentation

- **Quick Start:** `CLOUDFLARE_CONTAINERS_QUICKSTART.md`
- **Full Guide:** `CLOUDFLARE_CONTAINER_DEPLOYMENT.md`
- **Architecture:** `ARCHITECTURE.md`
- **API Reference:** `README.md`

## Support

Questions? Check:
1. Cloudflare Containers Docs: https://developers.cloudflare.com/containers/
2. Container Package: https://github.com/cloudflare/containers
3. Durable Objects: https://developers.cloudflare.com/durable-objects/

---

## 🎉 You're Ready!

Your AI Agents service is fully configured for Cloudflare Containers. Run these commands to deploy:

```bash
cd apps/ai-agents

# 1. Set secrets (if not done)
bash scripts/set-production-secrets.sh

# 2. Deploy
pnpm deploy

# 3. Wait ~5 minutes, then verify
pnpm containers:list

# 4. Test
curl https://ai-agents.YOUR_SUBDOMAIN.workers.dev/
```

**Happy deploying!** 🚀

