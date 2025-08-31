import { PrismaClient } from '../generated/prisma';

// Global Prisma instance for development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Database utility functions
export class DatabaseService {
  static async createOrUpdateContract(
    address: string, 
    abi: Record<string, unknown>[], 
    network: string, 
    name?: string
  ) {
    return await prisma.contract.upsert({
      where: { address },
      update: {
        abi,
        network,
        name,
        updatedAt: new Date(),
      },
      create: {
        address,
        abi,
        network,
        name,
      },
    });
  }

  static async storeEvents(
    events: Record<string, unknown>[],
    contractId: string,
    network: string
  ): Promise<{ count: number }> {
    console.log(`Processing ${events.length} events for storage...`);
    
    // Helper function to serialize BigInt values
    const serializeBigInt = (obj: Record<string, unknown>): string => {
      return JSON.stringify(obj, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      );
    };
    
    const eventRecords = events.map((event, index) => {
      try {
        // Log first event structure for debugging
        if (index === 0) {
          console.log('Sample event structure:', serializeBigInt(event));
        }

        const record = {
          blockNumber: BigInt(String(event.blockNumber || 0)),
          blockHash: String(event.blockHash || ''),
          blockTimestamp: null, // Viem logs don't include timestamp, we'll set it as null
          transactionHash: String(event.transactionHash || ''),
          transactionIndex: Number(event.transactionIndex || 0),
          logIndex: Number(event.logIndex || 0),
          contractId,
          contractAddress: String(event.address || '').toLowerCase(),
          eventName: String(event.eventName || 'Unknown'),
          eventSignature: Array.isArray(event.topics) && event.topics[0] ? String(event.topics[0]) : '',
          indexedParams: Array.isArray(event.topics) ? event.topics : [],
          data: typeof event.data === 'string' ? event.data : JSON.stringify(event.data || ''),
          rawLog: JSON.parse(serializeBigInt(event)), // Use our BigInt-safe serialization
          network,
        };

        console.log(`Event ${index + 1} processed:`, {
          eventName: record.eventName,
          blockNumber: record.blockNumber.toString(),
          txHash: record.transactionHash.slice(0, 10) + '...'
        });

        return record;
      } catch (error) {
        console.error(`Error processing event ${index}:`, error);
        console.error('Event data:', event);
        throw error;
      }
    });

    console.log(`Attempting to store ${eventRecords.length} processed events...`);

    // Use createMany with skipDuplicates to handle potential duplicates
    const result = await prisma.event.createMany({
      data: eventRecords,
      skipDuplicates: true,
    });

    console.log(`Successfully stored ${result.count} events in database`);
    return result;
  }

  static async getEventsByContract(
    contractAddress: string,
    options: {
      eventName?: string;
      fromBlock?: bigint;
      toBlock?: bigint;
      limit?: number;
      offset?: number;
      orderBy?: 'asc' | 'desc';
    } = {}
  ) {
    const {
      eventName,
      fromBlock,
      toBlock,
      limit = 100,
      offset = 0,
      orderBy = 'desc'
    } = options;

    return await prisma.event.findMany({
      where: {
        contractAddress,
        ...(eventName && { eventName }),
        ...(fromBlock && { blockNumber: { gte: fromBlock } }),
        ...(toBlock && { blockNumber: { lte: toBlock } }),
      },
      orderBy: {
        blockNumber: orderBy,
      },
      take: limit,
      skip: offset,
      include: {
        contract: true,
      },
    });
  }

  static async getEventStats(contractAddress: string) {
    const [totalEvents, eventTypes, blockRange] = await Promise.all([
      // Total events count
      prisma.event.count({
        where: { contractAddress },
      }),
      
      // Event types and their counts
      prisma.event.groupBy({
        by: ['eventName'],
        where: { contractAddress },
        _count: {
          eventName: true,
        },
      }),
      
      // Block range
      prisma.event.aggregate({
        where: { contractAddress },
        _min: { blockNumber: true },
        _max: { blockNumber: true },
      }),
    ]);

    return {
      totalEvents,
      eventTypes: eventTypes.map(et => ({
        name: et.eventName,
        count: et._count.eventName,
      })),
      blockRange: {
        from: blockRange._min.blockNumber?.toString(),
        to: blockRange._max.blockNumber?.toString(),
      },
    };
  }

  static async updateIndexingStatus(
    contractAddress: string, 
    network: string, 
    lastIndexedBlock: bigint
  ) {
    return await prisma.indexingStatus.upsert({
      where: {
        contractAddress_network: {
          contractAddress,
          network,
        },
      },
      update: {
        lastIndexedBlock,
        lastIndexedAt: new Date(),
        errorCount: 0,
        lastError: null,
      },
      create: {
        contractAddress,
        network,
        lastIndexedBlock,
        lastIndexedAt: new Date(),
      },
    });
  }

  static async getIndexingStatus(contractAddress: string, network: string) {
    return await prisma.indexingStatus.findUnique({
      where: {
        contractAddress_network: {
          contractAddress,
          network,
        },
      },
    });
  }

  static async searchEvents(query: {
    contractAddress?: string;
    eventName?: string;
    fromBlock?: bigint;
    toBlock?: bigint;
    network?: string;
    limit?: number;
    offset?: number;
  }) {
    const {
      contractAddress,
      eventName,
      fromBlock,
      toBlock,
      network,
      limit = 100,
      offset = 0
    } = query;

    return await prisma.event.findMany({
      where: {
        ...(contractAddress && { contractAddress }),
        ...(eventName && { eventName }),
        ...(network && { network }),
        ...(fromBlock && { blockNumber: { gte: fromBlock } }),
        ...(toBlock && { blockNumber: { lte: toBlock } }),
      },
      orderBy: {
        blockNumber: 'desc',
      },
      take: limit,
      skip: offset,
      include: {
        contract: true,
      },
    });
  }
}
