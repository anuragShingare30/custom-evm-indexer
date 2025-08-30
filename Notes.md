# MVP Indexer Architecture


1. **`User Input Layer`:**

**What happens:**
- User provides → Contract Address + Contract ABI + Events to track

**Tech Choices:**
- Frontend: Next.js + TailwindCSS
- API Layer: Node.js/Express (backend API to handle user input and trigger indexer logic)


2. **`Event Listener (Blockchain → Indexer)`**:

**What happens:**
- Backend listens to the specified smart contract events using Ethers.js or Web3.js.
- Whenever an event is emitted, it is captured in real-time + past events

**Tech Choices:**
- Node.js backend service
- Ethers.js (connect to blockchain)
- Alchemy / Infura RPC endpoint (to connect to Ethereum network)


3. **`Data Storage (Database Layer)`**:

**What happens:**
- Captured events are normalized (structured in tables) and stored.
- Example: For a Transfer event in ERC20, you store from, to, value, txHash, blockNumber.

**Tech Choices:**
- PostgreSQL as database
- Dockerized PostgreSQL container for easy local setup → docker-compose up -d postgres
- Later can scale to managed PostgreSQL (like Supabase or AWS RDS)


4. **`Indexing Layer`**:

**What happens:**
- Event listener continuously fetches logs → inserts into PostgreSQL.
- Indexer ensures no duplicates and handles reorgs by checking block numbers.

**Tech Choices:**
- Rust or Node.js worker (for performance, Rust is future upgrade, but Node.js is enough for MVP)
- Store last processed block in DB to resume safely after restart.


5. **`Query Layer (GraphQL API):`**

**What happens:**
- A GraphQL API sits on top of PostgreSQL.
- When frontend/dashboard queries → GraphQL fetches event data directly from DB.

**Tech Choices:**
- Hasura (GraphQL on top of Postgres) → auto generates queries/mutations
- OR Apollo GraphQL Server (custom resolvers pointing to PostgreSQL)


6. **`Frontend Dashboard`**

**What happens:**
- User can run queries via GraphQL → fetches indexed event data → shows on dashboard.
- Example: Display a list of Transfer events for an ERC20 token.

**Tech Choices:**
- Next.js frontend
- Apollo Client (GraphQL client)
- TailwindCSS + shadcn/ui (UI styling)



# Web3 Data Oracle + Indexing Protocol

## 1. Idea Title
Web3 Data Oracle + Indexing Protocol

## 2. Brief Description
- A decentralized indexing protocol similar to The Graph.
- Collects blockchain data, structures it, and exposes it via GraphQL for dApps.
- Makes it easier for developers to query blockchain events instead of manually scanning.
- Developers can register subgraphs, and indexer nodes will maintain and serve data.

## 3. Tech Stack and Tools Usage
- **Smart Contracts:** Solidity for event emission on EVM chains.
- **Indexer Backend:** Rust + Rindexer for indexing blockchain data.
- **Database:** PostgreSQL for structured data storage.
- **ORM:** Prisma ORM for data modeling and querying.
- **APIs:** GraphQL for exposing indexed data to frontend dApps.
- **Frontend:** Next.js + React.js for dashboard and user interaction.

## 4. Topic
Blockchain Data Indexing & Oracles

