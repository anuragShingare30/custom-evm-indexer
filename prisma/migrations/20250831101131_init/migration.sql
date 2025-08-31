-- CreateTable
CREATE TABLE "public"."Contract" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "name" TEXT,
    "abi" JSONB NOT NULL,
    "network" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastIndexedBlock" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Event" (
    "id" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "blockHash" TEXT NOT NULL,
    "blockTimestamp" TIMESTAMP(3),
    "transactionHash" TEXT NOT NULL,
    "transactionIndex" INTEGER NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "contractId" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventSignature" TEXT NOT NULL,
    "indexedParams" JSONB NOT NULL,
    "data" JSONB NOT NULL,
    "rawLog" JSONB NOT NULL,
    "network" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Chain" (
    "id" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "rpcUrl" TEXT NOT NULL,
    "blockTime" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IndexingStatus" (
    "id" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "lastIndexedBlock" BIGINT NOT NULL,
    "lastIndexedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndexingStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserQuery" (
    "id" TEXT NOT NULL,
    "queryHash" TEXT NOT NULL,
    "query" JSONB NOT NULL,
    "resultCount" INTEGER,
    "executionTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserQuery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Contract_address_key" ON "public"."Contract"("address");

-- CreateIndex
CREATE INDEX "Contract_address_idx" ON "public"."Contract"("address");

-- CreateIndex
CREATE INDEX "Contract_network_idx" ON "public"."Contract"("network");

-- CreateIndex
CREATE INDEX "Contract_isActive_idx" ON "public"."Contract"("isActive");

-- CreateIndex
CREATE INDEX "Event_blockNumber_idx" ON "public"."Event"("blockNumber");

-- CreateIndex
CREATE INDEX "Event_contractAddress_idx" ON "public"."Event"("contractAddress");

-- CreateIndex
CREATE INDEX "Event_eventName_idx" ON "public"."Event"("eventName");

-- CreateIndex
CREATE INDEX "Event_transactionHash_idx" ON "public"."Event"("transactionHash");

-- CreateIndex
CREATE INDEX "Event_network_idx" ON "public"."Event"("network");

-- CreateIndex
CREATE INDEX "Event_blockNumber_contractAddress_idx" ON "public"."Event"("blockNumber", "contractAddress");

-- CreateIndex
CREATE INDEX "Event_eventName_contractAddress_idx" ON "public"."Event"("eventName", "contractAddress");

-- CreateIndex
CREATE INDEX "Event_blockTimestamp_idx" ON "public"."Event"("blockTimestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Event_transactionHash_logIndex_key" ON "public"."Event"("transactionHash", "logIndex");

-- CreateIndex
CREATE UNIQUE INDEX "Chain_chainId_key" ON "public"."Chain"("chainId");

-- CreateIndex
CREATE INDEX "Chain_chainId_idx" ON "public"."Chain"("chainId");

-- CreateIndex
CREATE INDEX "Chain_isActive_idx" ON "public"."Chain"("isActive");

-- CreateIndex
CREATE INDEX "IndexingStatus_network_idx" ON "public"."IndexingStatus"("network");

-- CreateIndex
CREATE INDEX "IndexingStatus_isActive_idx" ON "public"."IndexingStatus"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "IndexingStatus_contractAddress_network_key" ON "public"."IndexingStatus"("contractAddress", "network");

-- CreateIndex
CREATE UNIQUE INDEX "UserQuery_queryHash_key" ON "public"."UserQuery"("queryHash");

-- CreateIndex
CREATE INDEX "UserQuery_createdAt_idx" ON "public"."UserQuery"("createdAt");

-- CreateIndex
CREATE INDEX "UserQuery_executionTime_idx" ON "public"."UserQuery"("executionTime");

-- AddForeignKey
ALTER TABLE "public"."Event" ADD CONSTRAINT "Event_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "public"."Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
