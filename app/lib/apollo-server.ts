import { gql } from 'graphql-tag';
import { DatabaseService } from './database';
import { prisma } from './database';
import type { Event } from '../generated/prisma';

// GraphQL Type Definitions
export const typeDefs = gql`
  type Contract {
    id: String!
    address: String!
    name: String
    network: String!
    abi: [ABIItem!]!
    createdAt: String!
    updatedAt: String!
    events: [Event!]!
  }

  type ABIItem {
    type: String!
    name: String
    inputs: [ABIInput!]
  }

  type ABIInput {
    type: String!
    name: String!
    indexed: Boolean
  }

  type Event {
    id: String!
    blockNumber: String!
    blockHash: String!
    blockTimestamp: String
    transactionHash: String!
    transactionIndex: Int!
    logIndex: Int!
    contractId: String!
    contractAddress: String!
    eventName: String!
    eventSignature: String!
    indexedParams: [String!]!
    data: String!
    rawLog: String!
    network: String!
    createdAt: String!
    contract: Contract!
  }

  type IndexingStatus {
    id: String!
    contractAddress: String!
    network: String!
    lastIndexedBlock: String!
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  input EventFilters {
    contractAddress: String
    eventName: String
    network: String
    fromBlock: String
    toBlock: String
    fromDate: String
    toDate: String
  }

  input PaginationInput {
    page: Int = 1
    limit: Int = 50
  }

  type EventsResponse {
    events: [Event!]!
    totalCount: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    currentPage: Int!
    totalPages: Int!
  }

  type SmartRangeInfo {
    fromBlock: String!
    toBlock: String!
    latestEventBlock: String
    totalEventsInRange: Int!
    isOptimalRange: Boolean!
    message: String!
  }

  type SmartEventsResponse {
    events: [Event!]!
    rangeInfo: SmartRangeInfo!
    totalCount: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    currentPage: Int!
    totalPages: Int!
  }

  type Query {
    # Get all contracts
    getContracts(network: String): [Contract!]!
    
    # Get contract by address
    getContract(address: String!, network: String!): Contract
    
    # Get events with filtering and pagination
    getEvents(filters: EventFilters, pagination: PaginationInput): EventsResponse!
    
    # Get events for a specific contract
    getEventsByContract(
      contractAddress: String!
      network: String!
      eventName: String
      pagination: PaginationInput
    ): EventsResponse!
    
    # Get indexing status for contracts
    getIndexingStatus(contractAddress: String, network: String): [IndexingStatus!]!
    
    # Get available event types for a contract (or all if no contract specified)
    getEventTypes(contractAddress: String, network: String): [String!]!
    
    # Smart range detection - automatically finds optimal block range
    getEventsSmartRange(
      contractAddress: String!
      network: String!
      eventName: String
      pagination: PaginationInput
    ): SmartEventsResponse!
  }
`;

// GraphQL Resolvers
export const resolvers = {
  Query: {
    // Get all contracts with optional network filtering
    getContracts: async (_: unknown, args: { network?: string }) => {
      try {
        const contracts = await DatabaseService.getContracts(args.network);
        return contracts.map(contract => ({
          ...contract,
          id: contract.id,
          createdAt: contract.createdAt.toISOString(),
          updatedAt: contract.updatedAt.toISOString(),
        }));
      } catch (error) {
        console.error('Error fetching contracts:', error);
        throw new Error('Failed to fetch contracts');
      }
    },

    // Get single contract by address
    getContract: async (_: unknown, args: { address: string; network: string }) => {
      try {
        const contract = await DatabaseService.getContract(args.address, args.network);
        if (!contract) return null;
        
        return {
          ...contract,
          id: contract.id,
          createdAt: contract.createdAt.toISOString(),
          updatedAt: contract.updatedAt.toISOString(),
        };
      } catch (error) {
        console.error('Error fetching contract:', error);
        throw new Error('Failed to fetch contract');
      }
    },

    // Get events with filtering and pagination
    getEvents: async (_: unknown, args: { 
      filters?: {
        contractAddress?: string;
        eventName?: string;
        network?: string;
        fromBlock?: string;
        toBlock?: string;
        fromDate?: string;
        toDate?: string;
      };
      pagination?: { page?: number; limit?: number };
    }) => {
      try {
        const page = args.pagination?.page || 1;
        const limit = args.pagination?.limit || 50;
        const offset = (page - 1) * limit;

        const result = await DatabaseService.getEventsWithPagination({
          filters: args.filters || {},
          limit,
          offset,
        });

        const totalPages = Math.ceil(result.totalCount / limit);

        return {
          events: result.events.map(event => ({
            ...event,
            id: event.id,
            blockNumber: event.blockNumber.toString(),
            rawLog: JSON.stringify(event.rawLog),
            createdAt: event.createdAt.toISOString(),
          })),
          totalCount: result.totalCount,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
          currentPage: page,
          totalPages,
        };
      } catch (error) {
        console.error('Error fetching events:', error);
        throw new Error('Failed to fetch events');
      }
    },

    // Get events for a specific contract
    getEventsByContract: async (_: unknown, args: {
      contractAddress: string;
      network: string;
      eventName?: string;
      pagination?: { page?: number; limit?: number };
    }) => {
      try {
        const page = args.pagination?.page || 1;
        const limit = args.pagination?.limit || 50;
        const offset = (page - 1) * limit;

        const result = await DatabaseService.getEventsByContract(
          args.contractAddress.toLowerCase(), // Ensure lowercase for matching
          {
            eventName: args.eventName,
            network: args.network,
            limit,
            offset,
          }
        );

        const totalPages = Math.ceil(result.totalCount / limit);

        return {
          events: result.events.map(event => ({
            ...event,
            id: event.id,
            blockNumber: event.blockNumber.toString(),
            rawLog: JSON.stringify(event.rawLog),
            createdAt: event.createdAt.toISOString(),
          })),
          totalCount: result.totalCount,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
          currentPage: page,
          totalPages,
        };
      } catch (error) {
        console.error('Error fetching events by contract:', error);
        throw new Error('Failed to fetch events by contract');
      }
    },

    // Get indexing status
    getIndexingStatus: async (_: unknown, args: { 
      contractAddress?: string; 
      network?: string; 
    }) => {
      try {
        const statuses = await DatabaseService.getIndexingStatuses(
          args.contractAddress,
          args.network
        );
        
        return statuses.map(status => ({
          ...status,
          id: status.id,
          lastIndexedBlock: status.lastIndexedBlock.toString(),
          createdAt: status.createdAt.toISOString(),
          updatedAt: status.updatedAt.toISOString(),
        }));
      } catch (error) {
        console.error('Error fetching indexing status:', error);
        throw new Error('Failed to fetch indexing status');
      }
    },

    // Get available event types for a contract (or all events if no contract specified)
    getEventTypes: async (_: unknown, args: { 
      contractAddress?: string; 
      network?: string; 
    }) => {
      try {
        const eventTypes = await DatabaseService.getEventTypes(
          args.contractAddress,
          args.network
        );
        return eventTypes;
      } catch (error) {
        console.error('Error fetching event types:', error);
        throw new Error('Failed to fetch event types');
      }
    },

    // Smart range detection - automatically finds optimal block range
    getEventsSmartRange: async (_: unknown, args: {
      contractAddress: string;
      network: string;
      eventName?: string;
      pagination?: { page?: number; limit?: number };
    }) => {
      try {
        const page = args.pagination?.page || 1;
        const limit = args.pagination?.limit || 50;
        const offset = (page - 1) * limit;

        const result = await DatabaseService.getEventsSmartRange({
          contractAddress: args.contractAddress,
          network: args.network,
          eventName: args.eventName,
          limit,
          offset,
        });

        const totalPages = Math.ceil(result.totalCount / limit);

        return {
          events: result.events.map(event => ({
            ...event,
            id: event.id,
            blockNumber: event.blockNumber.toString(),
            rawLog: JSON.stringify(event.rawLog),
            createdAt: event.createdAt.toISOString(),
          })),
          rangeInfo: result.rangeInfo,
          totalCount: result.totalCount,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
          currentPage: page,
          totalPages,
        };
      } catch (error) {
        console.error('Error fetching events with smart range:', error);
        throw new Error('Failed to fetch events with smart range');
      }
    },
  },

  // Nested resolvers for relationships
  Contract: {
    events: async (parent: { id: string; address: string }) => {
      try {
        // Option 1: Use the direct relationship through contractId (more efficient)
        const events = await prisma.event.findMany({
          where: {
            contractId: parent.id
          },
          orderBy: {
            blockNumber: 'desc'
          },
          take: 100, // Limit to prevent large responses
        });

        return events.map((event: Event) => ({
          ...event,
          id: event.id,
          blockNumber: event.blockNumber.toString(),
          rawLog: JSON.stringify(event.rawLog),
          createdAt: event.createdAt.toISOString(),
        }));
      } catch (error) {
        console.error('Error fetching contract events:', error);
        return [];
      }
    },
  },

  Event: {
    contract: async (parent: { contractId: string }) => {
      try {
        const contract = await DatabaseService.getContractById(parent.contractId);
        if (!contract) return null;
        
        return {
          ...contract,
          id: contract.id,
          createdAt: contract.createdAt.toISOString(),
          updatedAt: contract.updatedAt.toISOString(),
        };
      } catch (error) {
        console.error('Error fetching event contract:', error);
        return null;
      }
    },
  },
};
