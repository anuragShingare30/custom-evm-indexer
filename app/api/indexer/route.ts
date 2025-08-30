import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, parseAbi, Log } from 'viem';
import { mainnet, sepolia } from 'viem/chains';

// Type definitions
interface IndexerRequest {
  contractAddress: `0x${string}`;
  contractABI: string;
  eventsToTrack: string[];
  network?: 'mainnet' | 'sepolia';
  fromBlock?: string;
  toBlock?: string;
}

interface IndexerResponse {
  success: boolean;
  events?: Log[];
  error?: string;
  metadata?: {
    contractAddress: string;
    eventsTracked: string[];
    network: string;
    blockRange: {
      from: string;
      to: string;
    };
    totalEvents: number;
  };
}

interface ABIInput {
  type: string;
  name: string;
  indexed?: boolean;
}

interface ABIEvent {
  type: string;
  name: string;
  inputs?: ABIInput[];
}

interface ABIItem {
  type: string;
  name?: string;
  inputs?: ABIInput[];
}

// Convert BigInt values to strings for JSON serialization
const serializeBigIntValues = (obj: unknown): unknown => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => serializeBigIntValues(item));
  }
  
  if (typeof obj === 'object') {
    const serialized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeBigIntValues(value);
    }
    return serialized;
  }
  
  return obj;
};

// Network configuration
const getNetworkConfig = (network: string) => {
  switch (network) {
    case 'mainnet':
      return {
        chain: mainnet,
        rpcUrl: process.env.ALCHEMY_MAINNET_URL
      };
    case 'sepolia':
    default:
      return {
        chain: sepolia,
        rpcUrl: process.env.ALCHEMY_SEPOLIA_URL
      };
  }
};

// Extract event signatures from ABI
const extractEventSignatures = (abi: ABIItem[], eventsToTrack: string[]) => {
  const events = abi.filter((item): item is ABIEvent => 
    item.type === 'event' && 
    item.name !== undefined &&
    eventsToTrack.includes(item.name)
  );
  
  return events.map(event => ({
    name: event.name,
    signature: event
  }));
};

export async function POST(request: NextRequest) {
  try {
    const body: IndexerRequest = await request.json();
    
    const {
      contractAddress,
      contractABI,
      eventsToTrack,
      network = 'sepolia',
      fromBlock = 'earliest',
      toBlock = 'latest'
    } = body;

    // Validate required fields
    if (!contractAddress || !contractABI || !eventsToTrack.length) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: contractAddress, contractABI, or eventsToTrack'
      }, { status: 400 });
    }

    // Parse ABI
    let parsedABI;
    try {
      parsedABI = JSON.parse(contractABI);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Invalid ABI format. Please provide valid JSON.'
      }, { status: 400 });
    }

    // Get network configuration
    const { chain, rpcUrl } = getNetworkConfig(network);

    // Create Viem client
    const client = createPublicClient({
      chain,
      transport: http(rpcUrl)
    });

    // Extract event signatures from ABI
    const eventSignatures = extractEventSignatures(parsedABI, eventsToTrack);
    
    if (eventSignatures.length === 0) {
      return NextResponse.json({
        success: false,
        error: `No matching events found in ABI for: ${eventsToTrack.join(', ')}`
      }, { status: 400 });
    }

    // Get current block number for metadata
    const currentBlock = await client.getBlockNumber();
    
    // Calculate block range
    const fromBlockNum = fromBlock === 'earliest' ? BigInt(0) : BigInt(fromBlock);
    const toBlockNum = toBlock === 'latest' ? currentBlock : BigInt(toBlock);

    // Alchemy limitation: max 500 blocks per request
    const MAX_BLOCKS_PER_REQUEST = BigInt(500);
    const totalBlockRange = toBlockNum - fromBlockNum;
    
    console.log(`Total block range: ${totalBlockRange} blocks (from ${fromBlockNum} to ${toBlockNum})`);
    
    // Warn about large block ranges
    if (totalBlockRange > BigInt(10000)) {
      console.warn(`Large block range detected: ${totalBlockRange} blocks. This may take a while.`);
    }
    
    // Limit extremely large ranges to prevent timeout
    if (totalBlockRange > BigInt(50000)) {
      return NextResponse.json({
        success: false,
        error: `Block range too large: ${totalBlockRange} blocks. Please use a smaller range (max 50,000 blocks) to prevent timeout.`
      }, { status: 400 });
    }

    // Function to fetch logs in batches
    const fetchLogsInBatches = async (eventSig: { name: string; signature: ABIEvent }) => {
      const logs: Log[] = [];
      let currentFromBlock = fromBlockNum;
      
      // Create event ABI for this specific event
      const eventAbi = parseAbi([
        `event ${eventSig.signature.name}(${eventSig.signature.inputs?.map((input: ABIInput) => `${input.type} ${input.indexed ? 'indexed ' : ''}${input.name}`).join(', ') || ''})`
      ] as const);

      while (currentFromBlock <= toBlockNum) {
        const currentToBlock = currentFromBlock + MAX_BLOCKS_PER_REQUEST - BigInt(1);
        const batchToBlock = currentToBlock > toBlockNum ? toBlockNum : currentToBlock;
        
        console.log(`Fetching logs for ${eventSig.name} from block ${currentFromBlock} to ${batchToBlock}`);
        
        try {
          const batchLogs = await client.getLogs({
            address: contractAddress,
            event: eventAbi[0],
            fromBlock: currentFromBlock,
            toBlock: batchToBlock,
          });

          // Add event name to each log for easier identification
          const logsWithEventName = batchLogs.map((log: Log) => ({
            ...log,
            eventName: eventSig.name
          }));

          logs.push(...logsWithEventName);
          console.log(`Found ${batchLogs.length} events in batch (${currentFromBlock} to ${batchToBlock})`);
          
        } catch (batchError) {
          console.error(`Error fetching batch ${currentFromBlock}-${batchToBlock} for event ${eventSig.name}:`, batchError);
          // Continue with next batch even if current batch fails
        }
        
        currentFromBlock = batchToBlock + BigInt(1);
        
        // Add a small delay to avoid rate limiting
        if (currentFromBlock <= toBlockNum) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      return logs;
    };

    // Fetch logs for each event type using batch processing
    const allLogs: Log[] = [];
    
    for (const eventSig of eventSignatures) {
      try {
        console.log(`Starting batch fetch for event: ${eventSig.name}`);
        const eventLogs = await fetchLogsInBatches(eventSig);
        allLogs.push(...eventLogs);
        console.log(`Total logs found for ${eventSig.name}: ${eventLogs.length}`);
      } catch (eventError) {
        console.error(`Error fetching logs for event ${eventSig.name}:`, eventError);
        // Continue with other events even if one fails
      }
    }

    // Sort logs by block number and log index
    allLogs.sort((a, b) => {
      const blockDiff = Number(a.blockNumber) - Number(b.blockNumber);
      if (blockDiff !== 0) return blockDiff;
      return Number(a.logIndex) - Number(b.logIndex);
    });

    const response: IndexerResponse = {
      success: true,
      events: allLogs,
      metadata: {
        contractAddress,
        eventsTracked: eventsToTrack,
        network,
        blockRange: {
          from: fromBlockNum.toString(),
          to: toBlockNum.toString()
        },
        totalEvents: allLogs.length
      }
    };

    // Serialize BigInt values before sending response
    const serializedResponse = serializeBigIntValues(response) as IndexerResponse;

    return NextResponse.json(serializedResponse);

  } catch (error) {
    console.error('Indexer API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Web3 Indexer API is running',
    endpoints: {
      POST: '/api/indexer - Start indexing with contract details'
    }
  });
}
