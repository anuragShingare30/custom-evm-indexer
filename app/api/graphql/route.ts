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
  // Add CORS configuration
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL, process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''].filter(Boolean)
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
});

// Create the Next.js handler
const handler = startServerAndCreateNextHandler<NextRequest>(server, {
  context: async (req) => {
    // Add any context you need here (user auth, etc.)
    return {
      req,
      // Add authentication context if needed
      // user: await getUserFromToken(req.headers.authorization)
    };
  },
});

// Export handlers for both GET and POST
export { handler as GET, handler as POST };
