import { gql } from '@apollo/client';

// Query to get all contracts
export const GET_CONTRACTS = gql`
  query GetContracts($network: String) {
    getContracts(network: $network) {
      id
      address
      name
      network
      createdAt
      updatedAt
    }
  }
`;

// Query to get a single contract
export const GET_CONTRACT = gql`
  query GetContract($address: String!, $network: String!) {
    getContract(address: $address, network: $network) {
      id
      address
      name
      network
      abi {
        type
        name
        inputs {
          type
          name
          indexed
        }
      }
      createdAt
      updatedAt
    }
  }
`;

// Query to get events with filtering and pagination
export const GET_EVENTS = gql`
  query GetEvents($filters: EventFilters, $pagination: PaginationInput) {
    getEvents(filters: $filters, pagination: $pagination) {
      events {
        id
        blockNumber
        blockHash
        blockTimestamp
        transactionHash
        transactionIndex
        logIndex
        contractAddress
        eventName
        eventSignature
        indexedParams
        data
        network
        createdAt
        contract {
          id
          address
          name
          network
        }
      }
      totalCount
      hasNextPage
      hasPreviousPage
      currentPage
      totalPages
    }
  }
`;

// Query to get events for a specific contract
export const GET_EVENTS_BY_CONTRACT = gql`
  query GetEventsByContract(
    $contractAddress: String!
    $network: String!
    $eventName: String
    $pagination: PaginationInput
  ) {
    getEventsByContract(
      contractAddress: $contractAddress
      network: $network
      eventName: $eventName
      pagination: $pagination
    ) {
      events {
        id
        blockNumber
        blockHash
        transactionHash
        transactionIndex
        logIndex
        eventName
        eventSignature
        indexedParams
        data
        rawLog
        network
        createdAt
      }
      totalCount
      hasNextPage
      hasPreviousPage
      currentPage
      totalPages
    }
  }
`;

// Query to get indexing status
export const GET_INDEXING_STATUS = gql`
  query GetIndexingStatus($contractAddress: String, $network: String) {
    getIndexingStatus(contractAddress: $contractAddress, network: $network) {
      id
      contractAddress
      network
      lastIndexedBlock
      isActive
      createdAt
      updatedAt
    }
  }
`;

// Query to get available event types for a contract
export const GET_EVENT_TYPES = gql`
  query GetEventTypes($contractAddress: String!, $network: String!) {
    getEventTypes(contractAddress: $contractAddress, network: $network)
  }
`;

// Query to get basic stats for a quick overview
export const GET_OVERVIEW_STATS = gql`
  query GetOverviewStats($network: String) {
    getContracts(network: $network) {
      id
      address
      name
      network
      createdAt
    }
    getEvents(pagination: { limit: 5 }) {
      totalCount
      events {
        id
        eventName
        contractAddress
        blockNumber
        createdAt
      }
    }
  }
`;

// Fragment for event fields (reusable)
export const EVENT_FIELDS = gql`
  fragment EventFields on Event {
    id
    blockNumber
    blockHash
    blockTimestamp
    transactionHash
    transactionIndex
    logIndex
    contractAddress
    eventName
    eventSignature
    indexedParams
    data
    network
    createdAt
  }
`;

// Fragment for contract fields (reusable)
export const CONTRACT_FIELDS = gql`
  fragment ContractFields on Contract {
    id
    address
    name
    network
    createdAt
    updatedAt
  }
`;

// Query to get events with smart range detection
export const GET_EVENTS_SMART_RANGE = gql`
  query GetEventsSmartRange(
    $contractAddress: String!
    $network: String!
    $eventName: String
    $pagination: PaginationInput
  ) {
    getEventsSmartRange(
      contractAddress: $contractAddress
      network: $network
      eventName: $eventName
      pagination: $pagination
    ) {
      events {
        id
        blockNumber
        blockHash
        blockTimestamp
        transactionHash
        transactionIndex
        logIndex
        contractId
        contractAddress
        eventName
        eventSignature
        indexedParams
        data
        rawLog
        network
        createdAt
      }
      rangeInfo {
        fromBlock
        toBlock
        latestEventBlock
        totalEventsInRange
        isOptimalRange
        message
      }
      totalCount
      hasNextPage
      hasPreviousPage
      currentPage
      totalPages
    }
  }
`;
