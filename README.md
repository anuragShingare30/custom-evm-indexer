1. **User Input Layer**:

- Simple user dashboard -> contract address, abi, on-chain events to fetch
- React-hook-form
- Displaying live on-chain event + past events


2. **Indexer Service Layer**:

- Directly talk to an RPC provider (Alchemy)
- Fetch past logs in batch mode (e.g., 10k blocks at once).
- Store results in PostgreSQL(Prisma ORM).
- **Live Listener** – WebSocket subscription for new events.
- **Queue/Buffer** – Store events as pending until N confirmations.
- **Reorg Handler** – Detect chain reorg → rollback and re-fetch.
- **DB Writer** – Write finalized events into Postgres.

**demo**
```js
Contract sepolia: 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
Contract mainnet: 0xA0b86a33E6441956f6ed9f27c6eB6e5d22c02893
From Block: 6700000  
To Block: 6701000
Events: Transfer
```

**abi**
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