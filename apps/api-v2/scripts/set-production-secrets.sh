#!/bin/bash

# Script to set all production secrets for api-v2 Cloudflare Worker
# Run this from apps/api-v2 directory: bash scripts/set-production-secrets.sh

set -e

echo "🔐 Setting production secrets for api-v2 Cloudflare Worker"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  You will be prompted to enter each secret value."
echo "    Copy/paste the values from your .dev.vars file (or use production values)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# AWS Credentials
echo "1/12 Setting AWS_ACCESS_KEY_ID..."
pnpm wrangler secret put AWS_ACCESS_KEY_ID

echo "2/12 Setting AWS_SECRET_ACCESS_KEY..."
pnpm wrangler secret put AWS_SECRET_ACCESS_KEY

echo "3/12 Setting AWS_REGION..."
pnpm wrangler secret put AWS_REGION

echo "4/12 Setting AWS_REKOGNITION_COLLECTION..."
pnpm wrangler secret put AWS_REKOGNITION_COLLECTION

# Cloudflare R2 Credentials
echo "5/12 Setting R2_ACCOUNT_ID..."
pnpm wrangler secret put R2_ACCOUNT_ID

echo "6/12 Setting R2_BUCKET_NAME..."
pnpm wrangler secret put R2_BUCKET_NAME

echo "7/12 Setting R2_ACCESS_KEY_ID..."
pnpm wrangler secret put R2_ACCESS_KEY_ID

echo "8/12 Setting R2_SECRET_ACCESS_KEY..."
pnpm wrangler secret put R2_SECRET_ACCESS_KEY

echo "9/12 Setting R2_S3_API..."
pnpm wrangler secret put R2_S3_API

# AI Agents Service
echo "10/12 Setting AI_AGENTS_URL..."
echo "Enter your production AI Agents URL (or http://localhost:3001 for testing):"
pnpm wrangler secret put AI_AGENTS_URL

echo "11/12 Setting REASONING_AUTO_CALL_THRESHOLD..."
pnpm wrangler secret put REASONING_AUTO_CALL_THRESHOLD

# Environment
echo "12/12 Setting ENVIRONMENT..."
pnpm wrangler secret put ENVIRONMENT

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All secrets have been set!"
echo ""
echo "Verify secrets with:"
echo "  pnpm wrangler secret list"
echo ""
echo "Next steps:"
echo "  1. Deploy: pnpm deploy"
echo "  2. Run migrations: pnpm migrate:remote"
echo "  3. Seed database: pnpm seed:full:remote"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
