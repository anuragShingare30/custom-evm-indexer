import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { NextRequest } from 'next/server';
import { typeDefs, resolvers } from '@/app/lib/apollo-server';

// Create Apollo Server instance
const server = new ApolloServer({
  typeDefs,
  resolvers,
  // Enable GraphQL Playground in development
  introspection: process.env.NODE_ENV !== 'production',
});

// Create the Next.js handler
const handler = startServerAndCreateNextHandler(server, {
  context: async (req: NextRequest) => {
    // Add any context you need here (user auth, etc.)
    return {
      req,
      // Add authentication context if needed
      // user: await getUserFromToken(req.headers.authorization)
    };
  },
});

// Export handlers for both GET and POST with CORS
export async function GET(request: NextRequest) {
  const response = await handler(request);
  
  // Add CORS headers
  const corsOrigins = process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''].filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:3001'];
  
  const origin = request.headers.get('origin');
  if (origin && corsOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}

export async function POST(request: NextRequest) {
  const response = await handler(request);
  
  // Add CORS headers
  const corsOrigins = process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''].filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:3001'];
  
  const origin = request.headers.get('origin');
  if (origin && corsOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}

export async function OPTIONS(request: NextRequest) {
  const corsOrigins = process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''].filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:3001'];
  
  const origin = request.headers.get('origin');
  
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin && corsOrigins.includes(origin) ? origin : '',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
