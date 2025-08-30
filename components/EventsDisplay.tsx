"use client";

import { useState } from 'react';

interface EventLog {
  address: string;
  topics: string[];
  data: string;
  blockNumber: string; // String to handle BigInt serialization
  transactionHash: string;
  transactionIndex: string;
  blockHash: string;
  logIndex: string;
  removed: boolean;
  eventName?: string;
}

interface EventsDisplayProps {
  events: EventLog[];
  isLoading: boolean;
  error?: string;
  metadata?: {
    contractAddress: string;
    eventsTracked: string[];
    network: string;
    blockRange: {
      from: string;
      to: string;
    };
    totalEvents: number;
  };
}

export default function EventsDisplay({ events, isLoading, error, metadata }: EventsDisplayProps) {
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');

  const toggleEventExpansion = (index: number) => {
    setExpandedEvent(expandedEvent === index ? null : index);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatHash = (hash: string) => {
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  const getEtherscanUrl = (txHash: string, network: string) => {
    const baseUrl = network === 'mainnet' 
      ? 'https://etherscan.io/tx/' 
      : 'https://sepolia.etherscan.io/tx/';
    return baseUrl + txHash;
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-700 font-medium">Error fetching events</span>
        </div>
        <p className="text-red-600 mt-2 text-sm">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
          <span className="text-blue-700 font-medium">Fetching events from blockchain...</span>
        </div>
        <p className="text-blue-600 text-center mt-2 text-sm">This may take a few moments depending on the block range</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Metadata Section */}
      {metadata && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-black mb-3">Indexing Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Contract:</span>
              <span className="ml-2 font-mono text-black">{formatAddress(metadata.contractAddress)}</span>
            </div>
            <div>
              <span className="text-gray-600">Network:</span>
              <span className="ml-2 text-black capitalize">{metadata.network}</span>
            </div>
            <div>
              <span className="text-gray-600">Block Range:</span>
              <span className="ml-2 text-black">{metadata.blockRange.from} - {metadata.blockRange.to}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Events:</span>
              <span className="ml-2 font-semibold text-black">{metadata.totalEvents}</span>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-gray-600">Events Tracked:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {metadata.eventsTracked.map((event, index) => (
                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {event}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-black">
          Events {events.length > 0 && `(${events.length})`}
        </h3>
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 text-sm ${
              viewMode === 'table' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Table View
          </button>
          <button
            onClick={() => setViewMode('json')}
            className={`px-3 py-1 text-sm ${
              viewMode === 'json' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            JSON View
          </button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium text-gray-900 mb-2">No Events Found</p>
          <p>No events were found for the specified criteria. Try adjusting the block range or event names.</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {viewMode === 'table' ? (
            // Table View
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Block</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Log Index</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {events.map((event, index) => (
                    <>
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              {event.eventName || 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-black font-mono">
                          {event.blockNumber}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <a
                            href={getEtherscanUrl(event.transactionHash, metadata?.network || 'sepolia')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 font-mono underline inline-flex items-center"
                            title="View on Etherscan"
                          >
                            {formatHash(event.transactionHash)}
                            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-black">
                          {event.logIndex}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <button
                            onClick={() => toggleEventExpansion(index)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {expandedEvent === index ? 'Hide Details' : 'View Details'}
                          </button>
                        </td>
                      </tr>
                      
                      {/* Expanded Event Details - Right below the event row */}
                      {expandedEvent === index && (
                        <tr>
                          <td colSpan={5} className="px-4 py-4 bg-gray-50">
                            <div className="border border-gray-200 rounded-lg p-4 bg-white">
                              <h4 className="font-semibold text-black mb-3">Event Details</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Event Name:</span>
                                  <span className="ml-2 text-black">{event.eventName || 'Unknown'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Contract Address:</span>
                                  <span className="ml-2 font-mono text-black">{event.address}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Block Number:</span>
                                  <span className="ml-2 text-black">{event.blockNumber}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Transaction Hash:</span>
                                  <a
                                    href={getEtherscanUrl(event.transactionHash, metadata?.network || 'sepolia')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 font-mono text-blue-600 hover:text-blue-800 underline inline-flex items-center"
                                  >
                                    {event.transactionHash}
                                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </a>
                                </div>
                                <div>
                                  <span className="text-gray-600">Block Hash:</span>
                                  <span className="ml-2 font-mono text-black">{event.blockHash}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Log Index:</span>
                                  <span className="ml-2 text-black">{event.logIndex}</span>
                                </div>
                              </div>
                              
                              <div className="mt-4">
                                <h5 className="font-medium text-black mb-2">Topics:</h5>
                                <div className="space-y-1">
                                  {event.topics.map((topic, topicIndex) => (
                                    <div key={topicIndex} className="font-mono text-xs bg-gray-50 p-2 rounded border">
                                      <span className="text-gray-600">Topic {topicIndex}:</span>
                                      <span className="ml-2 text-black break-all">{topic}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="mt-4">
                                <h5 className="font-medium text-black mb-2">Data:</h5>
                                <div className="font-mono text-xs bg-gray-50 p-2 rounded border break-all text-black">
                                  {event.data}
                                </div>
                              </div>
                              
                              <div className="mt-4">
                                <h5 className="font-medium text-black mb-2">Raw JSON:</h5>
                                <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
                                  {JSON.stringify(event, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            // JSON View
            <div className="p-4">
              <pre className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-x-auto">
                {JSON.stringify(events, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
