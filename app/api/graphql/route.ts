import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { NextRequest } from 'next/server';
import { typeDefs, resolvers } from '@/app/lib/apollo-server';

// Create Apollo Server instance
const server = new ApolloServer({
  typeDefs,
  resolvers,
  // Enable introspection and playground for development and production
  introspection: true,
  // Disable CSRF protection for GraphiQL compatibility
  csrfPrevention: false,
  // Add formatting for better error handling
  formatError: (error) => {
    console.error('GraphQL Error:', error);
    return {
      message: error.message,
      // Only include error details in development
      ...(process.env.NODE_ENV === 'development' && {
        locations: error.locations,
        path: error.path,
        extensions: error.extensions,
      }),
    };
  },
});

// Create the Next.js handler
const handler = startServerAndCreateNextHandler(server, {
  context: async (req: NextRequest) => {
    return {
      req,
    };
  },
});

// Helper function to get CORS origins
function getCORSOrigins() {
  if (process.env.NODE_ENV === 'production') {
    const origins = [];
    if (process.env.FRONTEND_URL) origins.push(process.env.FRONTEND_URL);
    if (process.env.VERCEL_URL) origins.push(`https://${process.env.VERCEL_URL}`);
    // Add the actual deployment URL
    origins.push('https://custom-evm-indexer-hemg2ehow-anurag-pramod-shingares-projects.vercel.app');
    return origins;
  }
  return ['http://localhost:3000', 'http://localhost:3001'];
}

// Helper function to add CORS headers
function addCORSHeaders(response: Response, request: NextRequest) {
  const corsOrigins = getCORSOrigins();
  const origin = request.headers.get('origin');
  
  // Allow all origins in production for now, or specific origin if it matches
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Access-Control-Allow-Origin', '*');
  } else if (origin && corsOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  response.headers.set('Access-Control-Allow-Credentials', 'false');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Apollo-Require-Preflight');
  
  return response;
}

// Export handlers for both GET and POST with CORS
export async function GET(request: NextRequest) {
  try {
    const response = await handler(request);
    return addCORSHeaders(response, request);
  } catch (error) {
    console.error('GET handler error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const response = await handler(request);
    return addCORSHeaders(response, request);
  } catch (error) {
    console.error('POST handler error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Apollo-Require-Preflight',
    },
  });
}
