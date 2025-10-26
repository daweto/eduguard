# 🚀 Cloudflare Containers Quickstart

## Architecture Overview

Your AI Agents service uses **Cloudflare Containers**, which combines:

1. **Worker** (`src/worker.ts`) - Routes requests to containers
2. **Durable Object** (`AIAgentsContainer`) - Manages container lifecycle  
3. **Container** (Docker image) - Runs your Node.js server

```
Request → Worker → Durable Object → Container (Node.js + Hono + AI SDKs)
```

This architecture gives you:
- ✅ Full Node.js runtime in containers
- ✅ Automatic container lifecycle management
- ✅ Global edge deployment
- ✅ Simple routing and scaling

## Quick Deploy (3 Steps)

### 1. Set Secrets

```bash
cd apps/ai-agents
bash scripts/set-production-secrets.sh
```

Enter your:
- OpenAI API key
- ElevenLabs credentials
- Cloudflare API URL (your api-v2 worker URL)
- School name

### 2. Deploy

```bash
pnpm deploy
```

First deployment takes ~5-10 minutes as Cloudflare:
- Builds your Docker image
- Pushes to Cloudflare Registry
- Deploys the Worker
- Provisions container capacity

**Important:** After first deploy, wait ~5 minutes before testing. Containers need provisioning time.

### 3. Verify

```bash
# Check container status
pnpm containers:list

# View deployed images
pnpm containers:images

# Test health endpoint
curl https://ai-agents.YOUR_SUBDOMAIN.workers.dev/worker-health

# Test container endpoint
curl https://ai-agents.YOUR_SUBDOMAIN.workers.dev/
```

## How It Works

### The Worker (`src/worker.ts`)

Routes all incoming requests to your container:

```typescript
// Routes requests to a single container instance
const container = env.AI_AGENTS_CONTAINER.getByName('ai-agents-primary');
return await container.fetch(request);
```

### The Container Class

Manages your Node.js container:

```typescript
export class AIAgentsContainer extends Container {
  defaultPort = 3001;        // Your Node.js server port
  sleepAfter = '10m';        // Sleep after 10min idle
  envVars = {                // Passed to container
    PORT: '3001',
    NODE_ENV: 'production',
  };
}
```

### The Container (Dockerfile)

Runs your full Node.js app:
- Hono server
- Vercel AI SDK + GPT-4
- ElevenLabs SDK
- All Node.js APIs available

## Local Testing

### Test Node.js Server Directly

```bash
pnpm dev
# Visit http://localhost:3001
```

### Test with Docker

```bash
# Build
pnpm docker:build

# Run
pnpm docker:test

# Test
curl http://localhost:3001/
```

### Test Worker Locally (Advanced)

```bash
# Requires wrangler dev with container support
pnpm dev:worker
```

Note: Local worker dev may not fully support containers yet. Use Docker testing instead.

## Monitoring

### View Container Status

```bash
# List all containers
pnpm containers:list

# Expected output:
# Name: ai-agents
# Status: healthy
# Instances: 1/5
```

### View Logs

```bash
# Real-time logs from Worker and Container
pnpm wrangler tail

# Logs show both:
# - Worker routing
# - Container startup/requests
```

### Cloudflare Dashboard

Visit [dash.cloudflare.com](https://dash.cloudflare.com) → Workers & Pages → Containers

View:
- Container health
- Request metrics
- Logs and traces
- Image versions

## Scaling

Your configuration in `wrangler.jsonc`:

```jsonc
"containers": [{
  "max_instances": 5,  // Max containers running simultaneously
  "class_name": "AIAgentsContainer",
  "image": "./Dockerfile"
}]
```

**Scaling behavior:**
- Cloudflare automatically starts containers based on demand
- Containers sleep after `sleepAfter` duration (10 minutes)
- Max 5 containers can run simultaneously
- Cold start: ~1-2 seconds when waking up

**For your use case:**
- `max_instances: 5` is plenty
- Most requests hit the same container (stateless)
- Containers auto-scale on demand

## Cost Estimate

**Cloudflare Containers:**
- Base: $5-10/month
- Compute: ~$0.50 per million requests
- Expected: **~$10-15/month** for AI Agents

**External APIs:**
- OpenAI GPT-4o-mini: ~$15/month
- ElevenLabs: ~$300/month (voice calls)

**Total: ~$325-330/month**

## Troubleshooting

### "Container unavailable" errors

**After first deploy:**
```bash
# Wait 5-10 minutes, then check
pnpm containers:list
```

Containers need provisioning time on first deploy.

**Ongoing issues:**
```bash
# Check container health
pnpm wrangler tail

# Look for startup errors
```

### Secrets not loading

```bash
# Verify secrets exist
pnpm wrangler secret list

# Re-set if missing
pnpm wrangler secret put OPENAI_API_KEY
```

### Docker build fails

```bash
# Test locally first
pnpm docker:build

# Check for errors in Dockerfile
```

### "max_instances exceeded"

Increase in `wrangler.jsonc`:
```jsonc
"max_instances": 10  // Up from 5
```

## API Endpoints

Once deployed, all your app endpoints work:

```bash
BASE_URL=https://ai-agents.YOUR_SUBDOMAIN.workers.dev

# Health check (worker level)
curl $BASE_URL/worker-health

# Health check (container level)
curl $BASE_URL/

# Reasoning agent
curl -X POST $BASE_URL/api/reasoning/analyze \
  -H "Content-Type: application/json" \
  -d '{"student_id":"123",...}'

# Voice agent
curl -X POST $BASE_URL/api/voice/call \
  -H "Content-Type: application/json" \
  -d '{"to_phone":"+56912345678",...}'
```

## Updating Your Deployment

```bash
# Make code changes to src/index.ts or routes/

# Rebuild and deploy
pnpm deploy

# Cloudflare will:
# - Build new Docker image
# - Push to registry
# - Update container deployments
# - Route new requests to new version
```

## GitHub Actions CI/CD

Push to `main` triggers automatic deployment:

```bash
git add .
git commit -m "feat: update reasoning agent"
git push origin main
```

Required GitHub secrets:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## Next Steps

1. ✅ Deploy AI Agents
2. ✅ Wait ~5 minutes for provisioning
3. ✅ Test endpoints
4. ⏭️ Update api-v2 `AI_AGENTS_URL` secret
5. ⏭️ Test full integration
6. ⏭️ Monitor usage and costs

## Additional Resources

- [Cloudflare Containers Docs](https://developers.cloudflare.com/containers/)
- [Container Package (@cloudflare/containers)](https://github.com/cloudflare/containers)
- [Durable Objects Docs](https://developers.cloudflare.com/durable-objects/)
- [CLOUDFLARE_CONTAINER_DEPLOYMENT.md](./CLOUDFLARE_CONTAINER_DEPLOYMENT.md) - Full guide

---

**You're all set!** 🎉 Deploy with `pnpm deploy` and you'll have AI Agents running on Cloudflare's edge.

