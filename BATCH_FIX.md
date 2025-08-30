# 🔧 Fixed: Alchemy 500-Block Limitation + BigInt Serialization

## Problems Solved

### 1. **Alchemy 500-Block Limit** 📦
The error was occurring because Alchemy has a **500-block limit** per `eth_getLogs` request, but our indexer was trying to query from block 0 to latest (millions of blocks).

### 2. **BigInt JSON Serialization** 🔢
Second error: `Do not know how to serialize a BigInt` - Viem returns block numbers as BigInt, but JSON.stringify() can't handle BigInt values directly.

## Solutions Implemented

### 1. **Batch Processing** 📦
- Split large block ranges into 500-block chunks
- Process each batch sequentially with rate limiting
- Add progress logging for each batch

### 2. **BigInt Serialization** 🔢
- Added `serializeBigIntValues()` helper function
- Converts all BigInt values to strings before JSON response
- Maintains data integrity while fixing serialization

### 3. **Reasonable Defaults** ⚡
- Changed default `fromBlock` from "earliest" to `6000000` (more recent)
- Added block range validation (max 50,000 blocks to prevent timeout)
- Added helpful tips in the UI

### 4. **Better Error Handling** 🛡️
- Continue processing other events if one fails
- Detailed error messages with suggested solutions
- Progress logging for debugging

## How to Test

### Option 1: Recent Blocks (Recommended)
```
Contract Address: 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
From Block: 6000000
To Block: latest
Events: Transfer, Approval
```

### Option 2: Specific Range (Fast)
```
Contract Address: 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
From Block: 6700000
To Block: 6701000
Events: Transfer
```

### Option 3: Very Recent (Instant)
```
Contract Address: 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
From Block: 6720000
To Block: latest
Events: Transfer
```

## Sample ABI (USDC-like ERC20)
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

## What Changed

### Backend (`/app/api/indexer/route.ts`)
- ✅ Added `fetchLogsInBatches()` function
- ✅ 500-block chunking with rate limiting
- ✅ Progress logging for each batch
- ✅ Block range validation (max 50K blocks)
- ✅ **NEW**: `serializeBigIntValues()` helper function
- ✅ **NEW**: BigInt to string conversion before JSON response
- ✅ Better error handling

### Frontend (`/app/page.tsx` & `/components/EventsDisplay.tsx`)
- ✅ Changed default `fromBlock` to `6000000`
- ✅ Added helpful placeholder text
- ✅ Added tip about block ranges
- ✅ **NEW**: Updated TypeScript interfaces to expect string values
- ✅ Better form validation

## Technical Details

### BigInt Serialization Fix
```typescript
// Before: Error - BigInt values can't be JSON.stringify()
return NextResponse.json({
  events: allLogs // Contains BigInt values
});

// After: Convert BigInt to strings
const serializeBigIntValues = (obj: unknown): unknown => {
  if (typeof obj === 'bigint') return obj.toString();
  // ... handle arrays and objects recursively
};

const serializedResponse = serializeBigIntValues(response);
return NextResponse.json(serializedResponse);
```

### Batch Processing Logic
```typescript
// Split large ranges into 500-block chunks
while (currentFromBlock <= toBlockNum) {
  const currentToBlock = currentFromBlock + BigInt(500) - BigInt(1);
  const batchToBlock = currentToBlock > toBlockNum ? toBlockNum : currentToBlock;
  
  // Fetch logs for this batch
  const batchLogs = await client.getLogs({
    fromBlock: currentFromBlock,
    toBlock: batchToBlock,
  });
  
  currentFromBlock = batchToBlock + BigInt(1);
}
```

## Expected Behavior

1. **Small Ranges** (< 1000 blocks): ⚡ Instant results
2. **Medium Ranges** (1K-10K blocks): 🚀 1-10 seconds
3. **Large Ranges** (10K-50K blocks): ⏱️ 30-60 seconds
4. **Very Large Ranges** (> 50K blocks): ❌ Rejected with error

## Console Output Example
```
Total block range: 1000 blocks (from 6700000 to 6701000)
Starting batch fetch for event: Transfer
Fetching logs for Transfer from block 6700000 to 6700499
Found 42 events in batch (6700000 to 6700499)
Fetching logs for Transfer from block 6700500 to 6701000
Found 38 events in batch (6700500 to 6701000)
Total logs found for Transfer: 80
```

The indexer now handles Alchemy's limitations gracefully and provides much better user experience! 🎉
