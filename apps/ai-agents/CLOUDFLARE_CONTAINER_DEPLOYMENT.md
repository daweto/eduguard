# Cloudflare Container Deployment for AI Agents

This guide covers deploying the AI Agents Node.js service as a Docker container to Cloudflare Workers using Cloudflare's container support.

## Why Containers on Cloudflare?

- ✅ **Node.js Support**: Full Node.js runtime with all APIs
- ✅ **Unified Platform**: Keep everything on Cloudflare (api-v2 + ai-agents)
- ✅ **Automatic Scaling**: Cloudflare handles scaling globally
- ✅ **Simple Deployment**: One `wrangler deploy` command
- ✅ **Cost Effective**: Pay-per-use pricing
- ✅ **Low Latency**: Global edge network

## Prerequisites

1. Cloudflare account with Workers paid plan
2. Docker installed locally (for testing)
3. Wrangler CLI installed

## Setup

### 1. Enable Container Support

Container support should be enabled in your Cloudflare account. If not, contact Cloudflare support or check your plan.

### 2. Install Dependencies

```bash
# From repo root
pnpm install

# Install wrangler globally (if needed)
pnpm add -g wrangler
```

### 3. Configure Secrets

Set production secrets in Cloudflare:

```bash
cd apps/ai-agents
bash scripts/set-production-secrets.sh
```

This will prompt you for:

- `OPENAI_API_KEY` - Your OpenAI API key
- `ELEVENLABS_API_KEY` - Your ElevenLabs API key
- `ELEVENLABS_AGENT_ID` - Your ElevenLabs agent ID
- `ELEVENLABS_PHONE_NUMBER_ID` - Your ElevenLabs phone number
- `CLOUDFLARE_API_URL` - Your api-v2 URL (e.g., https://api-v2.YOUR_SUBDOMAIN.workers.dev)
- `SCHOOL_NAME` - School name (optional)

### 4. Verify Secrets

```bash
pnpm wrangler secret list
```

## Local Testing

### Test with Docker locally:

```bash
# Build the Docker image (from repo root)
cd apps/ai-agents
pnpm docker:build

# Run locally with your .dev.vars file
pnpm docker:test

# Or manually:
docker run -p 3001:3001 \
  -e OPENAI_API_KEY=sk-... \
  -e ELEVENLABS_API_KEY=... \
  -e ELEVENLABS_AGENT_ID=... \
  -e ELEVENLABS_PHONE_NUMBER_ID=... \
  -e CLOUDFLARE_API_URL=https://api-v2.YOUR_SUBDOMAIN.workers.dev \
  -e SCHOOL_NAME="Colegio Skyward" \
  eduguard-ai-agents:local

# Test the endpoints
curl http://localhost:3001/
curl -X POST http://localhost:3001/api/reasoning/analyze \
  -H "Content-Type: application/json" \
  -d '{"student_id":"test","student_name":"Test Student",...}'
```

## Deployment

### Manual Deployment

```bash
# From apps/ai-agents directory
pnpm deploy

# Or from repo root
cd ../..
pnpm wrangler deploy --config apps/ai-agents/wrangler.jsonc --dockerfile apps/ai-agents/Dockerfile
```

### Automated Deployment (GitHub Actions)

The workflow `.github/workflows/deploy-ai-agents.yml` automatically deploys when you push to `main` with changes in:

- `apps/ai-agents/**`
- `packages/**`
- `pnpm-lock.yaml`

**Required GitHub Secrets:**

- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

#### Creating Cloudflare API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use "Edit Cloudflare Workers" template
4. Permissions needed:
   - Account > Workers Scripts > Edit
   - Account > Workers R2 > Edit (if using R2)
5. Copy token and add to GitHub Secrets

## Container Configuration

The deployment uses a multi-stage Dockerfile:

```dockerfile
# Stage 1: Build
- Install pnpm
- Copy workspace dependencies
- Build TypeScript
- Prune dev dependencies

# Stage 2: Runtime
- Minimal Alpine Linux + Node.js 22
- Non-root user (hono:nodejs)
- Health check endpoint
- Expose port 3001
```

## Monitoring

### View Logs

```bash
# Real-time logs
pnpm wrangler tail

# Or via Cloudflare dashboard
# Workers & Pages > ai-agents > Logs
```

### Check Deployment Status

```bash
pnpm wrangler deployments list
```

### Health Check

```bash
curl https://ai-agents.YOUR_SUBDOMAIN.workers.dev/
```

Expected response:

```json
{
  "status": "ok",
  "service": "EduGuard AI Agents",
  "agents": {
    "reasoning": "GPT-4 via Vercel AI SDK",
    "voice": "ElevenLabs Conversational AI"
  },
  "timestamp": "2025-10-26T12:00:00.000Z"
}
```

## Environment Variables

All secrets are managed via Cloudflare's secure vault:

```bash
# View configured secrets
pnpm wrangler secret list

# Add/update a secret
pnpm wrangler secret put SECRET_NAME

# Delete a secret
pnpm wrangler secret delete SECRET_NAME
```

## Scaling

Cloudflare automatically scales your container globally:

- **Auto-scaling**: Based on request load
- **Global distribution**: Runs on edge network
- **No configuration needed**: Cloudflare handles it

## Pricing

Cloudflare Workers with Containers:

- **Included**: First 100,000 requests/day
- **Paid**: $5/month + $0.50 per million requests
- **CPU time**: 10ms free, then $0.02 per million GB-s

Estimated monthly cost for EduGuard:

- ~10,000 reasoning requests/month: **~$5-10/month**
- OpenAI API: **~$15/month**
- ElevenLabs calls: **~$300/month** (10 calls/day)
- **Total: ~$320-325/month**

## Troubleshooting

### Container won't build

```bash
# Test locally first
cd ../..
docker build -f apps/ai-agents/Dockerfile -t test .

# Check Docker logs
docker logs <container_id>
```

### Deployment fails

```bash
# Verify wrangler auth
pnpm wrangler whoami

# Check account ID
pnpm wrangler account list

# Re-authenticate if needed
pnpm wrangler login
```

### Secrets not loading

```bash
# Verify secrets exist
pnpm wrangler secret list

# Re-set a secret
pnpm wrangler secret put OPENAI_API_KEY
```

### Health check failing

```bash
# Check logs
pnpm wrangler tail

# Test locally with Docker
pnpm docker:build
pnpm docker:test
```

### "Module not found" errors

Ensure all dependencies are in `dependencies`, not `devDependencies`:

```json
{
  "dependencies": {
    "@ai-sdk/openai": "^1.1.5",
    "@elevenlabs/elevenlabs-js": "^2.20.1",
    "@hono/node-server": "^1.14.1",
    "ai": "^5.0.79",
    "hono": "^4.10.3",
    "zod": "^3.24.1"
  }
}
```

## Limitations

- **Cold starts**: First request after idle may be slower (~1-2s)
- **CPU time**: Limited to 30 seconds per request
- **Memory**: Limited based on plan (512MB-1GB typically)
- **Max request size**: 100MB

For the EduGuard use case, these limits are more than sufficient.

## Comparison: Cloudflare vs AWS ECS

| Feature              | Cloudflare Container | AWS ECS             |
| -------------------- | -------------------- | ------------------- |
| Setup complexity     | ⭐ Simple            | ⭐⭐⭐ Complex      |
| Deployment           | Single command       | Multi-step          |
| Scaling              | Automatic            | Configure           |
| Global edge          | ✅ Built-in          | ❌ Multi-region     |
| Cost                 | ~$5-10/month         | ~$30-50/month       |
| Node.js support      | ✅ Full              | ✅ Full             |
| Secrets management   | Wrangler CLI         | AWS Secrets Manager |
| Platform consistency | ✅ Same as api-v2    | ❌ Different        |

**Verdict**: Cloudflare Container is simpler and more cost-effective for this use case.

## Next Steps

1. ✅ Deploy container to Cloudflare
2. ✅ Set production secrets
3. ✅ Configure GitHub Actions
4. ⏭️ Test reasoning endpoint
5. ⏭️ Test voice call endpoint
6. ⏭️ Update api-v2 to use production AI_AGENTS_URL
7. ⏭️ Monitor usage and costs

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Container Support](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)
- [Pricing Calculator](https://workers.cloudflare.com/pricing)
