#!/bin/bash

# Test script to call the indexer API with a real ERC-20 contract (USDC on Sepolia)
curl -X POST http://localhost:3000/api/indexer \
  -H "Content-Type: application/json" \
  -d '{
    "contractAddress": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    "contractABI": "[{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"from\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"value\",\"type\":\"uint256\"}],\"name\":\"Transfer\",\"type\":\"event\"}]",
    "eventsToTrack": ["Transfer"],
    "network": "sepolia",
    "fromBlock": "6700000",
    "toBlock": "6700100"
  }'
