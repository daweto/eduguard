# AI Agents Deployment Guide

This guide explains how to deploy the AI Agents service to Cloudflare Workers.

## Prerequisites

1. **Cloudflare Account** with Workers enabled
2. **Wrangler CLI** installed (included in devDependencies)
3. **API Keys** for:
   - OpenAI (GPT-4)
   - ElevenLabs (Conversational AI)

## Local Development

### Using Node.js (Traditional)

```bash
# Copy environment variables
cp .env.example .env

# Edit .env with your API keys
# Then run:
pnpm dev
```

### Using Cloudflare Workers (Local)

```bash
# Set secrets locally
wrangler secret put OPENAI_API_KEY
wrangler secret put ELEVENLABS_API_KEY
wrangler secret put ELEVENLABS_AGENT_ID
wrangler secret put ELEVENLABS_PHONE_NUMBER_ID
wrangler secret put SCHOOL_NAME

# Run local dev server
pnpm dev:worker
```

## Production Deployment

### Option 1: Manual Deployment

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Set up secrets** (one-time):

   ```bash
   wrangler secret put OPENAI_API_KEY
   wrangler secret put ELEVENLABS_API_KEY
   wrangler secret put ELEVENLABS_AGENT_ID
   wrangler secret put ELEVENLABS_PHONE_NUMBER_ID
   wrangler secret put SCHOOL_NAME
   ```

3. **Deploy:**
   ```bash
   pnpm deploy
   ```

### Option 2: GitHub Actions (Recommended)

The service automatically deploys to Cloudflare Workers when you push to the `main` branch.

#### Required GitHub Secrets

Set these in your repository settings (Settings → Secrets and variables → Actions):

| Secret Name                  | Description                                         | Example           |
| ---------------------------- | --------------------------------------------------- | ----------------- |
| `CLOUDFLARE_API_TOKEN`       | Cloudflare API token with Workers deploy permission | `ABC123...`       |
| `CLOUDFLARE_ACCOUNT_ID`      | Your Cloudflare account ID                          | `abc123def456...` |
| `OPENAI_API_KEY`             | OpenAI API key for GPT-4                            | `sk-proj-...`     |
| `ELEVENLABS_API_KEY`         | ElevenLabs API key                                  | `abc123...`       |
| `ELEVENLABS_AGENT_ID`        | ElevenLabs Conversational AI agent ID               | `agent_...`       |
| `ELEVENLABS_PHONE_NUMBER_ID` | ElevenLabs phone number ID (Twilio)                 | `phone_...`       |
| `SCHOOL_NAME`                | School name for branding                            | `Colegio Skyward` |

#### Deployment Workflow

The GitHub Action (`.github/workflows/deploy-ai-agents.yml`) will:

1. ✅ Lint the code
2. ✅ Run type checking
3. ✅ Deploy to Cloudflare Workers
4. ✅ Set all environment secrets

The service will be available at: `https://ai-agents.dweinsteint.workers.dev`

## Environment Variables

### Required Secrets

- **OPENAI_API_KEY**: Your OpenAI API key for GPT-4 reasoning agent
- **ELEVENLABS_API_KEY**: Your ElevenLabs API key for voice calls
- **ELEVENLABS_AGENT_ID**: ID of your ElevenLabs conversational AI agent
- **ELEVENLABS_PHONE_NUMBER_ID**: ElevenLabs/Twilio phone number ID

### Optional Variables

- **SCHOOL_NAME**: School name for voice calls (default: "Colegio Skyward")

## API Endpoints

After deployment, the following endpoints will be available:

### Health Check

```
GET https://ai-agents.dweinsteint.workers.dev/
```

### Reasoning Agent

```
POST https://ai-agents.dweinsteint.workers.dev/api/reasoning/analyze
```

### Voice Agent

```
POST https://ai-agents.dweinsteint.workers.dev/api/voice/call
GET  https://ai-agents.dweinsteint.workers.dev/api/voice/calls
GET  https://ai-agents.dweinsteint.workers.dev/api/voice/call/:call_id
```

## Monitoring

- **Logs**: View in Cloudflare Dashboard → Workers & Pages → ai-agents → Logs
- **Analytics**: Observability is enabled for performance monitoring
- **Alerts**: Set up alerts in Cloudflare Dashboard for errors and latency

## Troubleshooting

### Deployment fails with "secret not found"

Make sure all required secrets are set in GitHub repository settings.

### API calls fail with 401/403

Check that your API keys are valid and have sufficient permissions.

### Voice calls don't work

Verify your ElevenLabs agent is configured with:

- Spanish language
- Appropriate voice
- Twilio phone number integration

### Local development with dotenv not working

When deployed to Cloudflare Workers, `dotenv` is not available. Use `wrangler secret` instead.

## Architecture Notes

- **Runtime**: Cloudflare Workers (V8 isolates)
- **Framework**: Hono.js (works seamlessly with Workers)
- **AI SDK**: Vercel AI SDK with OpenAI provider
- **Voice**: ElevenLabs Conversational AI with Twilio integration
- **Compatibility**: nodejs_compat flag enabled for Node.js APIs

## Cost Considerations

- **Cloudflare Workers**: Free tier includes 100,000 requests/day
- **OpenAI GPT-4**: Pay per token (reasoning agent)
- **ElevenLabs**: Pay per minute of voice calls
- **Twilio**: Pay per call (via ElevenLabs)

## Security

- All API keys stored as encrypted secrets
- CORS enabled (configure allowed origins in production)
- No sensitive data logged
- Observability enabled for monitoring

## Support

For issues or questions:

1. Check the [main README](../../README.md)
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md)
3. Open an issue on GitHub
