#!/bin/bash

# Script to set all production secrets for ai-agents Cloudflare Worker
# Run this from apps/ai-agents directory: bash scripts/set-production-secrets.sh

set -e

echo "🤖 Setting production secrets for ai-agents Cloudflare Worker"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  You will be prompted to enter each secret value."
echo ""
echo "📝 Required secrets (6 total):"
echo "   1. OPENAI_API_KEY - Your OpenAI API key (sk-...)"
echo "   2. ELEVENLABS_API_KEY - Your ElevenLabs API key"
echo "   3. ELEVENLABS_AGENT_ID - Your ElevenLabs Conversational AI Agent ID"
echo "   4. ELEVENLABS_PHONE_NUMBER_ID - Your ElevenLabs phone number ID"
echo "   5. CLOUDFLARE_API_URL - Your production API v2 URL"
echo "   6. SCHOOL_NAME - School name (optional, defaults to 'Colegio Skyward')"
echo ""
echo "ℹ️  Note: All secrets are stored securely in Cloudflare's vault."
echo "   CI/CD will automatically load them during deployment."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# OpenAI
echo "1/6 Setting OPENAI_API_KEY..."
echo "Enter your OpenAI API key (starts with sk-):"
pnpm wrangler secret put OPENAI_API_KEY

# ElevenLabs
echo ""
echo "2/6 Setting ELEVENLABS_API_KEY..."
echo "Enter your ElevenLabs API key:"
pnpm wrangler secret put ELEVENLABS_API_KEY

echo ""
echo "3/6 Setting ELEVENLABS_AGENT_ID..."
echo "Enter your ElevenLabs Conversational AI Agent ID:"
pnpm wrangler secret put ELEVENLABS_AGENT_ID

echo ""
echo "4/6 Setting ELEVENLABS_PHONE_NUMBER_ID..."
echo "Enter your ElevenLabs phone number ID:"
pnpm wrangler secret put ELEVENLABS_PHONE_NUMBER_ID

# Cloudflare API URL
echo ""
echo "5/6 Setting CLOUDFLARE_API_URL..."
echo "Enter your production Cloudflare Workers API URL (e.g., https://api-v2.dweinsteint.workers.dev):"
pnpm wrangler secret put CLOUDFLARE_API_URL

# School Name (optional)
echo ""
echo "6/6 Setting SCHOOL_NAME (optional)..."
echo "Enter school name (press Enter to use default 'Colegio Skyward'):"
pnpm wrangler secret put SCHOOL_NAME

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All secrets have been set in Cloudflare!"
echo ""
echo "Verify secrets with:"
echo "  pnpm wrangler secret list"
echo ""
echo "✨ Good news: CI/CD will automatically use these secrets!"
echo "   No need to add secrets to GitHub Actions."
echo ""
echo "Next steps:"
echo "  1. Deploy: pnpm deploy"
echo "  2. Test reasoning endpoint: curl https://ai-agents.dweinsteint.workers.dev/api/health"
echo "  3. Test from api-v2 integration"
echo ""
echo "📚 Documentation:"
echo "  - Setup: README.md"
echo "  - Architecture: ARCHITECTURE.md"
echo "  - Deployment: DEPLOYMENT.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
