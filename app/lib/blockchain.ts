import { createPublicClient, http } from 'viem';
import { mainnet, sepolia } from 'viem/chains';

// Network configuration with fallback options
const getNetworkConfig = (network: string) => {
  switch (network) {
    case 'mainnet':
      return {
        chain: mainnet,
        rpcUrl: process.env.MAINNET_RPC_URL || process.env.ALCHEMY_MAINNET_URL || 'https://rpc.ankr.com/eth'
      };
    case 'sepolia':
      return {
        chain: sepolia,
        rpcUrl: process.env.SEPOLIA_RPC_URL || process.env.ALCHEMY_SEPOLIA_URL || 'https://rpc.ankr.com/eth_sepolia'
      };
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
};

// Create blockchain utilities
export class BlockchainService {
  /**
   * Get the latest block number for a given network
   */
  static async getLatestBlockNumber(network: string = 'sepolia'): Promise<bigint> {
    try {
      const { chain, rpcUrl } = getNetworkConfig(network);
      
      const client = createPublicClient({
        chain,
        transport: http(rpcUrl)
      });

      const blockNumber = await client.getBlockNumber();
      return blockNumber;
    } catch (error) {
      console.error('Error fetching latest block number:', error);
      throw new Error(`Failed to fetch latest block number for ${network}`);
    }
  }

  /**
   * Get block information by block number
   */
  static async getBlock(blockNumber: bigint, network: string = 'sepolia') {
    try {
      const { chain, rpcUrl } = getNetworkConfig(network);
      
      const client = createPublicClient({
        chain,
        transport: http(rpcUrl)
      });

      const block = await client.getBlock({ blockNumber });
      return block;
    } catch (error) {
      console.error('Error fetching block:', error);
      throw new Error(`Failed to fetch block ${blockNumber} for ${network}`);
    }
  }

  /**
   * Calculate recommended block range (latest block - 1000 to latest block)
   */
  static async getRecommendedBlockRange(network: string = 'sepolia'): Promise<{
    fromBlock: string;
    toBlock: string;
    latestBlock: string;
  }> {
    try {
      const latestBlock = await this.getLatestBlockNumber(network);
      const fromBlock = latestBlock - BigInt(1000); // Go back 1000 blocks
      
      return {
        fromBlock: fromBlock.toString(),
        toBlock: latestBlock.toString(),
        latestBlock: latestBlock.toString()
      };
    } catch (error) {
      console.error('Error calculating recommended block range:', error);
      throw new Error(`Failed to calculate block range for ${network}`);
    }
  }
}
