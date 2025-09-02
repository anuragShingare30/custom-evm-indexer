#!/bin/bash

# Test script to verify GraphQL endpoint is working
URL="${1:-http://localhost:3000/api/graphql}"

echo "Testing GraphQL endpoint: $URL"
echo ""

# Test 1: Basic __typename query
echo "Test 1: Basic __typename query"
response=$(curl -s -X POST -H "Content-Type: application/json" -d '{"query":"query { __typename }"}' "$URL")
echo "Response: $response"
echo ""

# Test 2: Schema introspection
echo "Test 2: Schema introspection"
response=$(curl -s -X POST -H "Content-Type: application/json" -d '{"query":"query { __schema { queryType { name } } }"}' "$URL")
echo "Response: $response"
echo ""

# Test 3: Contract query
echo "Test 3: Contract query"
response=$(curl -s -X POST -H "Content-Type: application/json" -d '{"query":"query { getContracts { id name address network } }"}' "$URL")
echo "Response: $response"
echo ""

echo "Testing complete!"
