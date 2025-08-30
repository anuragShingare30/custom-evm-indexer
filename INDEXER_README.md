# Custom Web3 Indexer

A custom blockchain event indexer built with Next.js, Viem, and Alchemy RPC.

## Features

- ✅ **Custom Event Indexing**: Fetch past and live blockchain events
- ✅ **Multi-Network Support**: Ethereum Mainnet and Sepolia Testnet
- ✅ **Real-time UI**: React-based dashboard with form validation
- ✅ **Flexible Block Range**: Query specific block ranges or use 'earliest'/'latest'
- ✅ **Event Filtering**: Track specific events by name
- ✅ **Raw Data Display**: JSON and table views for event data
- ✅ **Type Safety**: Full TypeScript implementation

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   - Copy `.env.local.example` to `.env.local`
   - Add your Alchemy API key to the environment variables
   - Get your API key from [Alchemy](https://www.alchemy.com/)

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

## Usage

### Testing with ERC-20 Token (Example)

You can test the indexer with a popular ERC-20 token like USDC:

**Contract Address** (Sepolia): `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` (USDC)
**Contract Address** (Mainnet): `0xA0b86a33E6441956f6ed9f27c6eB6e5d22c02893` (USDC)

**Sample ABI** (for Transfer and Approval events):
```json
[
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "from", "type": "address"},
      {"indexed": true, "name": "to", "type": "address"},
      {"indexed": false, "name": "value", "type": "uint256"}
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "owner", "type": "address"},
      {"indexed": true, "name": "spender", "type": "address"},
      {"indexed": false, "name": "value", "type": "uint256"}
    ],
    "name": "Approval",
    "type": "event"
  }
]
```

**Events to Track**: 
- Add "Transfer" (press Enter)
- Add "Approval" (press Enter)

### API Endpoints

- **POST** `/api/indexer` - Start indexing with contract details
- **GET** `/api/indexer` - Health check

### Request Format

```json
{
  "contractAddress": "0x...",
  "contractABI": "[{...}]",
  "eventsToTrack": ["Transfer", "Approval"],
  "network": "sepolia",
  "fromBlock": "earliest",
  "toBlock": "latest"
}
```

## Architecture

### Frontend (`app/page.tsx`)
- React Hook Form for efficient form handling
- Real-time event display with table/JSON views
- Network and block range configuration

### Backend API (`app/api/indexer/route.ts`)
- Viem client for blockchain interactions
- Alchemy RPC provider integration
- Event filtering and log retrieval
- Type-safe error handling

### Components (`components/EventsDisplay.tsx`)
- Event visualization in table and JSON formats
- Expandable event details
- Metadata display (block range, contract info)

## Next Steps

1. **Database Integration**: Store events in PostgreSQL with Prisma ORM
2. **Live Listening**: WebSocket subscriptions for real-time events
3. **Reorg Handling**: Detect and handle blockchain reorganizations
4. **Pagination**: Handle large event datasets efficiently
5. **GraphQL API**: Expose indexed data via GraphQL

## Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Backend**: Next.js API Routes, TypeScript
- **Blockchain**: Viem, Alchemy RPC
- **Form Handling**: React Hook Form
- **Styling**: TailwindCSS

## Environment Variables

```env
NEXT_PUBLIC_ALCHEMY_API_KEY=your_api_key_here
ALCHEMY_MAINNET_URL=https://eth-mainnet.g.alchemy.com/v2/your_api_key_here
ALCHEMY_SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/your_api_key_here
NEXT_PUBLIC_DEFAULT_NETWORK=sepolia
```
