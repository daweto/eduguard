# Cloudflare Workers Setup for AI Agents

This document provides step-by-step instructions for deploying the AI Agents service to Cloudflare Workers.

## ✅ What We've Done

The AI Agents service has been configured to run on Cloudflare Workers:

1. ✅ Created `wrangler.jsonc` configuration
2. ✅ Added GitHub Actions workflow for automatic deployment
3. ✅ Updated package.json with deployment scripts
4. ✅ Installed wrangler CLI tool
5. ✅ Created deployment documentation

## 🚀 Quick Start

### Prerequisites

Before deploying, you need:

1. **Cloudflare Account** ([Sign up here](https://dash.cloudflare.com/sign-up))
2. **OpenAI API Key** ([Get it here](https://platform.openai.com/api-keys))
3. **ElevenLabs Account** with:
   - API Key ([Get it here](https://elevenlabs.io/app/settings/api-keys))
   - Conversational AI Agent ([Create one](https://elevenlabs.io/app/conversational-ai))
   - Phone Number ID (Twilio integration)

### GitHub Secrets Setup

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions → New repository secret):

```bash
# Cloudflare Credentials
CLOUDFLARE_API_TOKEN=<your-cloudflare-api-token>
CLOUDFLARE_ACCOUNT_ID=<your-cloudflare-account-id>

# AI Service Credentials
OPENAI_API_KEY=sk-proj-...
ELEVENLABS_API_KEY=<your-elevenlabs-key>
ELEVENLABS_AGENT_ID=<your-agent-id>
ELEVENLABS_PHONE_NUMBER_ID=<your-phone-number-id>
SCHOOL_NAME=Colegio Skyward
```

### Getting Cloudflare Credentials

1. **API Token**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Click on your profile → API Tokens
   - Create Token → Use "Edit Cloudflare Workers" template
   - Copy the token (save it securely, you won't see it again!)

2. **Account ID**:
   - Go to Workers & Pages
   - Your Account ID is shown on the right sidebar

### Deployment

Once secrets are configured, deployment is automatic:

```bash
# Push to main branch
git add .
git commit -m "Deploy AI agents to Cloudflare"
git push origin main
```

The GitHub Action will:

1. Lint and type-check the code
2. Deploy to Cloudflare Workers
3. Configure all environment secrets
4. Provide deployment summary

### Manual Deployment (Optional)

If you prefer to deploy manually:

```bash
# From the ai-agents directory
cd apps/ai-agents

# Set secrets (one-time)
pnpm exec wrangler secret put OPENAI_API_KEY
pnpm exec wrangler secret put ELEVENLABS_API_KEY
pnpm exec wrangler secret put ELEVENLABS_AGENT_ID
pnpm exec wrangler secret put ELEVENLABS_PHONE_NUMBER_ID
pnpm exec wrangler secret put SCHOOL_NAME

# Deploy
pnpm deploy
```

## 📍 Deployment URL

After deployment, your service will be available at:

```
https://ai-agents.dweinsteint.workers.dev
```

**Note**: Update this URL in your configuration:

- `apps/api-v2/src/routes/reasoning.ts` - Update the proxy URL
- `apps/api-v2/src/routes/voice.ts` - Update the proxy URL

## 🧪 Testing the Deployment

### Health Check

```bash
curl https://ai-agents.dweinsteint.workers.dev/
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
  "timestamp": "2025-10-26T..."
}
```

### Reasoning Agent Test

```bash
curl -X POST https://ai-agents.dweinsteint.workers.dev/api/reasoning/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "test-001",
    "student_name": "Test Student",
    "session_id": "session-001",
    "today_attendance": [{
      "date": "2025-10-26",
      "status": "absent"
    }],
    "history_7d": [{
      "date": "2025-10-25",
      "status": "present"
    }]
  }'
```

## 🔍 Monitoring

### View Logs

```bash
# Real-time logs
pnpm exec wrangler tail

# Or in Cloudflare Dashboard:
# Workers & Pages → ai-agents → Logs
```

### Check Deployment Status

```bash
pnpm exec wrangler deployments list
```

## 🔧 Troubleshooting

### "Authentication error"

- Verify `CLOUDFLARE_API_TOKEN` is correct
- Ensure token has Workers deploy permissions

### "Worker exceeded CPU limit"

- OpenAI API calls may take time
- Consider implementing caching
- Use streaming responses for long operations

### "Module not found" errors

- Ensure all dependencies are listed in `package.json`
- Run `pnpm install` to verify lock file
- Check that imports use correct file extensions (`.js` for ESM)

### Secrets not working

- Secrets must be set via `wrangler secret put` or GitHub Actions
- `.env` files are NOT read in production
- Use `wrangler secret list` to verify secrets are set

## 📊 Performance Considerations

### Cold Start

- First request may take 100-500ms
- Subsequent requests are typically < 50ms

### Request Limits

- CPU time: 50ms (can be increased)
- Memory: 128MB default
- Request size: 100MB max

### Optimization Tips

1. Use streaming responses for long operations
2. Implement request caching where appropriate
3. Consider batching AI requests
4. Monitor logs for performance bottlenecks

## 🔐 Security Best Practices

1. **Never commit secrets** to Git
2. **Rotate API keys** regularly
3. **Configure CORS** appropriately for production
4. **Monitor usage** to detect anomalies
5. **Set up rate limiting** for API endpoints

## 📚 Additional Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Hono Framework Docs](https://hono.dev/)
- [Vercel AI SDK Docs](https://sdk.vercel.ai/)
- [ElevenLabs API Docs](https://elevenlabs.io/docs)

## 🆘 Getting Help

If you encounter issues:

1. Check the [DEPLOYMENT.md](./DEPLOYMENT.md) guide
2. Review logs in Cloudflare Dashboard
3. Test locally with `pnpm dev:worker`
4. Open an issue on GitHub

## ✨ Next Steps

After successful deployment:

1. ✅ Update API proxy URLs in `api-v2`
2. ✅ Test all endpoints
3. ✅ Monitor logs for errors
4. ✅ Set up custom domain (optional)
5. ✅ Configure rate limiting (optional)
