import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Type definitions for our GraphQL data
interface Event {
  id: string;
  eventName: string;
  contractAddress: string;
  blockNumber: string;
  transactionHash: string;
  // Add other event fields as needed
}

// Create HTTP link to our GraphQL endpoint
const httpLink = createHttpLink({
  uri: process.env.NODE_ENV === 'production' 
    ? process.env.NEXT_PUBLIC_GRAPHQL_URL || '/api/graphql'
    : 'http://localhost:3000/api/graphql',
});

// Auth link (for future authentication if needed)
const authLink = setContext((_, { headers }) => {
  // Get authentication token from localStorage if available
  // const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  return {
    headers: {
      ...headers,
      // authorization: token ? `Bearer ${token}` : "",
      'Content-Type': 'application/json',
    }
  };
});

// Create Apollo Client instance
export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          getEvents: {
            // Cache policy for events - merge existing with new data
            keyArgs: ['filters'], // Cache based on filters
            merge(existing, incoming) {
              if (!existing) return incoming;
              
              // Merge events arrays, avoiding duplicates
              const existingEvents = existing.events || [];
              const incomingEvents = incoming.events || [];
              const allEvents = [...existingEvents];
              
              // Add new events that don't already exist
              incomingEvents.forEach((newEvent: Event) => {
                if (!allEvents.find((e: Event) => e.id === newEvent.id)) {
                  allEvents.push(newEvent);
                }
              });
              
              return {
                ...incoming,
                events: allEvents,
              };
            },
          },
          getEventsByContract: {
            keyArgs: ['contractAddress', 'network', 'eventName'],
            merge(existing, incoming) {
              if (!existing) return incoming;
              
              const existingEvents = existing.events || [];
              const incomingEvents = incoming.events || [];
              const allEvents = [...existingEvents];
              
              incomingEvents.forEach((newEvent: Event) => {
                if (!allEvents.find((e: Event) => e.id === newEvent.id)) {
                  allEvents.push(newEvent);
                }
              });
              
              return {
                ...incoming,
                events: allEvents,
              };
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network',
    },
    query: {
      errorPolicy: 'all',
      fetchPolicy: 'cache-first',
    },
  },
  // Enable development tools - removed as it's not available in newer versions
});

// Helper function to clear cache (useful for real-time updates)
export const clearApolloCache = () => {
  apolloClient.cache.reset();
};

// Helper function to refetch all active queries
export const refetchAllQueries = () => {
  apolloClient.refetchQueries({ include: 'active' });
};
