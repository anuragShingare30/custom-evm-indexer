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
    console.log(`Processing ${events.length} events for storage...`); // comment
    
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

        // comment
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

    // comment
    console.log(`Attempting to store ${eventRecords.length} processed events...`);

    // Use createMany with skipDuplicates to handle potential duplicates
    const result = await prisma.event.createMany({
      data: eventRecords,
      skipDuplicates: true,
    });

    // comment
    console.log(`Successfully stored ${result.count} events in database`);
    return result;
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

  // New methods for GraphQL resolvers
  static async getContracts(network?: string) {
    return await prisma.contract.findMany({
      where: {
        ...(network && { network }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  static async getContract(address: string, network: string) {
    return await prisma.contract.findFirst({
      where: {
        address,
        network,
      },
    });
  }

  static async getContractById(id: string) {
    return await prisma.contract.findUnique({
      where: { id },
    });
  }

  static async getEventsWithPagination(options: {
    filters: {
      contractAddress?: string;
      eventName?: string;
      network?: string;
      fromBlock?: string;
      toBlock?: string;
      fromDate?: string;
      toDate?: string;
    };
    limit: number;
    offset: number;
  }) {
    const { filters, limit, offset } = options;
    
    const where: {
      contractAddress?: string;
      eventName?: string;
      network?: string;
      blockNumber?: { gte?: bigint; lte?: bigint };
      createdAt?: { gte?: Date; lte?: Date };
    } = {};
    
    if (filters.contractAddress) {
      where.contractAddress = filters.contractAddress;
    }
    
    if (filters.eventName) {
      where.eventName = filters.eventName;
    }
    
    if (filters.network) {
      where.network = filters.network;
    }
    
    if (filters.fromBlock) {
      where.blockNumber = { gte: BigInt(filters.fromBlock) };
    }
    
    if (filters.toBlock) {
      if (where.blockNumber) {
        where.blockNumber.lte = BigInt(filters.toBlock);
      } else {
        where.blockNumber = { lte: BigInt(filters.toBlock) };
      }
    }
    
    if (filters.fromDate) {
      where.createdAt = { gte: new Date(filters.fromDate) };
    }
    
    if (filters.toDate) {
      if (where.createdAt) {
        where.createdAt.lte = new Date(filters.toDate);
      } else {
        where.createdAt = { lte: new Date(filters.toDate) };
      }
    }

    const [events, totalCount] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: {
          blockNumber: 'desc',
        },
        take: limit,
        skip: offset,
        include: {
          contract: true,
        },
      }),
      prisma.event.count({ where }),
    ]);

    return { events, totalCount };
  }

  static async getIndexingStatuses(contractAddress?: string, network?: string) {
    return await prisma.indexingStatus.findMany({
      where: {
        ...(contractAddress && { contractAddress }),
        ...(network && { network }),
      },
      orderBy: {
        lastIndexedAt: 'desc',
      },
    });
  }

  static async getEventTypes(contractAddress: string, network: string) {
    const eventTypes = await prisma.event.groupBy({
      by: ['eventName'],
      where: {
        contractAddress,
        network,
      },
    });
    
    return eventTypes.map(et => et.eventName);
  }

  // Updated getEventsByContract method to support new GraphQL requirements
  static async getEventsByContract(
    contractAddress: string,
    options: {
      eventName?: string;
      network?: string;
      fromBlock?: bigint;
      toBlock?: bigint;
      limit?: number;
      offset?: number;
      orderBy?: 'asc' | 'desc';
    } = {}
  ) {
    const {
      eventName,
      network,
      fromBlock,
      toBlock,
      limit = 100,
      offset = 0,
      orderBy = 'desc'
    } = options;

    const where: {
      contractAddress: string;
      eventName?: string;
      network?: string;
      blockNumber?: { gte?: bigint; lte?: bigint };
    } = {
      contractAddress,
      ...(eventName && { eventName }),
      ...(network && { network }),
    };

    if (fromBlock) {
      where.blockNumber = { gte: fromBlock };
    }
    
    if (toBlock) {
      if (where.blockNumber) {
        where.blockNumber.lte = toBlock;
      } else {
        where.blockNumber = { lte: toBlock };
      }
    }

    const [events, totalCount] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: {
          blockNumber: orderBy,
        },
        take: limit,
        skip: offset,
        include: {
          contract: true,
        },
      }),
      prisma.event.count({ where }),
    ]);

    return { events, totalCount };
  }

  // Smart range detection - finds latest event block and creates optimal range
  static async getEventsSmartRange(options: {
    contractAddress: string;
    network: string;
    eventName?: string;
    limit: number;
    offset: number;
  }) {
    const { contractAddress, network, eventName, limit, offset } = options;
    
    // First, find the latest block number where events occurred for this contract
    const baseWhere: {
      contractAddress: string;
      network: string;
      eventName?: string;
    } = {
      contractAddress,
      network,
    };
    
    if (eventName) {
      baseWhere.eventName = eventName;
    }
    
    // Get the latest event to determine the optimal block range
    const latestEvent = await prisma.event.findFirst({
      where: baseWhere,
      orderBy: {
        blockNumber: 'desc',
      },
      select: {
        blockNumber: true,
      },
    });
    
    let fromBlock: bigint;
    let toBlock: bigint;
    let latestEventBlock: string | null = null;
    let isOptimalRange = false;
    let message = '';
    
    if (latestEvent) {
      // Found events for this contract
      latestEventBlock = latestEvent.blockNumber.toString();
      toBlock = latestEvent.blockNumber;
      fromBlock = toBlock - BigInt(999); // 1000 block range (inclusive)
      isOptimalRange = true;
      message = `Found events up to block ${toBlock.toString()}. Showing range: ${fromBlock.toString()} - ${toBlock.toString()} (1000 blocks)`;
    } else {
      // No events found for this contract, use recent blocks from blockchain
      const { BlockchainService } = await import('./blockchain');
      try {
        const latestNetworkBlock = await BlockchainService.getLatestBlockNumber(network);
        toBlock = latestNetworkBlock;
        fromBlock = toBlock - BigInt(999);
        isOptimalRange = false;
        message = `No events found for this contract. Searching recent blocks: ${fromBlock.toString()} - ${toBlock.toString()} (1000 blocks)`;
      } catch (error) {
        // Fallback to a reasonable default range
        toBlock = BigInt(23000000); // Reasonable default
        fromBlock = toBlock - BigInt(999);
        isOptimalRange = false;
        message = `Unable to fetch latest block. Using default range: ${fromBlock.toString()} - ${toBlock.toString()} (1000 blocks)`;
        console.warn('Failed to fetch latest block:', error);
      }
    }
    
    // Ensure fromBlock is not negative
    if (fromBlock < BigInt(0)) {
      fromBlock = BigInt(0);
    }
    
    // Now query events in the calculated range
    const where = {
      ...baseWhere,
      blockNumber: {
        gte: fromBlock,
        lte: toBlock,
      },
    };
    
    const [events, totalCount] = await Promise.all([
      prisma.event.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: [
          { blockNumber: 'desc' },
          { logIndex: 'desc' },
        ],
        include: {
          contract: true,
        },
      }),
      prisma.event.count({ where }),
    ]);
    
    return {
      events,
      totalCount,
      rangeInfo: {
        fromBlock: fromBlock.toString(),
        toBlock: toBlock.toString(),
        latestEventBlock,
        totalEventsInRange: totalCount,
        isOptimalRange,
        message,
      },
    };
  }
}
