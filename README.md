# **User Input Layer**:

- Simple user dashboard -> contract address, abi, on-chain events to fetch
- React-hook-form
- Displaying live on-chain event + past events


# **Indexer Service Layer**:

- Directly talk to an RPC provider (Alchemy)
- Fetch past logs in batch mode (e.g., 10k blocks at once).
- Store results in PostgreSQL(Prisma ORM).
- **Live Listener** – WebSocket subscription for new events.
- **Queue/Buffer** – Store events as pending until N confirmations.
- **Reorg Handler** – Detect chain reorg → rollback and re-fetch.
- **DB Writer** – Write finalized events into Postgres.


# **Database storage layer**:

- PostgreSQL with Prisma ORM + Dockerized PostgreSQL
```bash
# Define your database schema
schema.prisma

# Apply migrations
npx prisma migrate dev --name init

# Manage your data
npx prisma studio
```


- We need a flexible schema, since events differ by contract
- define model `Contract`, `Event`, `Chain`

1. **When event listener/indexer runs**:
    - Connects to RPC (Alchemy/Infura).
    - Fetches past logs in batches.
    - Listens for real-time events (eth_subscribe).
    - Decodes logs using ABI → JSON { from, to, value }.
    - Saves into Event table.

2. **GraphQL Layer**:
    - Queries Event table by filters (block range, eventName, contract, indexedParams).

3. **Queue + Retry (for reorgs):**
    - If a block gets reorged, update blockHash & re-fetch logs from replaced block range.
    - Store events with blockHash for consistency.  


# **GraphQL Layer**:

1. **Apollo Server -> Indexer + Database + API**:
- Fetches/stores blockchain events in DB.
- Exposes them via GraphQL schema.
- Example query a user can run:
```
1. define graphql schema
2. define data set (db, rest-api, another server)
3. define resolver
```

start
2. **Apollo Client -> Query Builder UI**:
- Users don’t directly write GraphQL manually (unless you give them that option).
- Instead, they use a visual query builder UI (dropdowns, filters, date pickers, event types, etc.).
- Your query builder generates GraphQL queries under the hood → `Apollo Client sends them to Apollo Server` → shows results nicely in UI (tables, charts, etc.)
```
1. init ApolloClient
2. Connect your client to react
3. fetch data with 'useQuery'
```






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