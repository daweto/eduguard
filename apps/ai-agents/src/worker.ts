/**
 * Cloudflare Worker for AI Agents Container
 * 
 * This Worker routes requests to the AI Agents container running in a Durable Object.
 * The container runs the full Node.js server with Hono, Vercel AI SDK, and ElevenLabs.
 */

import { Container } from '@cloudflare/containers';

// Container-enabled Durable Object
export class AIAgentsContainer extends Container {
  // Port the Node.js server listens on inside the container
  defaultPort = 3001;
  
  // Sleep after 10 minutes of inactivity to save costs
  sleepAfter = '10m';
  
  // Environment variables passed to the container
  // These will be available in the Node.js app via process.env
  envVars = {
    PORT: '3001',
    NODE_ENV: 'production',
  };

  override onStart() {
    console.log('🤖 AI Agents Container started successfully');
  }

  override onStop() {
    console.log('🛑 AI Agents Container shut down');
  }

  override onError(error: unknown) {
    console.error('❌ AI Agents Container error:', error);
  }
}

// Worker fetch handler
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Health check at worker level
    if (url.pathname === '/worker-health') {
      return Response.json({
        status: 'ok',
        worker: 'ai-agents-proxy',
        timestamp: new Date().toISOString(),
      });
    }

    // Route all other requests to the container
    // Using getByName with a fixed name ensures we use a single container instance
    // For load balancing across multiple containers, you could use getRandom or other routing logic
    const container = env.AI_AGENTS_CONTAINER.getByName('ai-agents-primary');
    
    try {
      // Forward the request to the container
      return await container.fetch(request);
    } catch (error) {
      console.error('Error routing to container:', error);
      return Response.json(
        {
          error: 'Container unavailable',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 503 }
      );
    }
  },
};

// TypeScript types for environment bindings
export interface Env {
  AI_AGENTS_CONTAINER: DurableObjectNamespace<AIAgentsContainer>;
  
  // Secrets (set via wrangler secret put)
  OPENAI_API_KEY: string;
  ELEVENLABS_API_KEY: string;
  ELEVENLABS_AGENT_ID: string;
  ELEVENLABS_PHONE_NUMBER_ID: string;
  CLOUDFLARE_API_URL: string;
  SCHOOL_NAME?: string;
}

