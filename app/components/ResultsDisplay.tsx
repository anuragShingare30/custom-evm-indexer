'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_EVENTS } from '@/app/lib/graphql-queries';

interface Event {
  id: string;
  blockNumber: string;
  blockHash: string;
  transactionHash: string;
  transactionIndex: number;
  logIndex: number;
  contractAddress: string;
  eventName: string;
  eventSignature: string;
  indexedParams: string[];
  data: string;
  network: string;
  createdAt: string;
  contract: {
    id: string;
    address: string;
    name?: string;
    network: string;
  };
}

interface EventsResponse {
  events: Event[];
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  currentPage: number;
  totalPages: number;
}

interface ResultsDisplayProps {
  filters: Record<string, string>;
  refreshTrigger?: number;
}

export function ResultsDisplay({ filters, refreshTrigger }: ResultsDisplayProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  // Query events with current filters and pagination
  const { data, loading, error, refetch } = useQuery<{ getEvents: EventsResponse }>(GET_EVENTS, {
    variables: {
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      pagination: {
        page: currentPage,
        limit: pageSize,
      },
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  // Refetch when refresh trigger changes
  useState(() => {
    if (refreshTrigger) {
      refetch();
    }
  });

  const events = data?.getEvents?.events || [];
  const totalCount = data?.getEvents?.totalCount || 0;
  const hasNextPage = data?.getEvents?.hasNextPage || false;
  const hasPreviousPage = data?.getEvents?.hasPreviousPage || false;
  const totalPages = data?.getEvents?.totalPages || 1;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setExpandedEvent(null); // Close any expanded events
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  const getEtherscanUrl = (type: 'tx' | 'block' | 'address', value: string, network: string) => {
    const baseUrl = network === 'mainnet' 
      ? 'https://etherscan.io' 
      : 'https://sepolia.etherscan.io';
    
    switch (type) {
      case 'tx':
        return `${baseUrl}/tx/${value}`;
      case 'block':
        return `${baseUrl}/block/${value}`;
      case 'address':
        return `${baseUrl}/address/${value}`;
      default:
        return '#';
    }
  };

  const exportToJson = () => {
    const dataStr = JSON.stringify(events, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `events-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const exportToCsv = () => {
    const headers = ['Event Name', 'Block Number', 'Transaction Hash', 'Contract Address', 'Date'];
    const csvContent = [
      headers.join(','),
      ...events.map(event => [
        event.eventName,
        event.blockNumber,
        event.transactionHash,
        event.contractAddress,
        new Date(event.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    const exportFileDefaultName = `events-${new Date().toISOString().split('T')[0]}.csv`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">Error loading events</h3>
        <p className="text-red-600 text-sm mt-1">{error.message}</p>
        <button
          onClick={() => refetch()}
          className="mt-2 px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Query Results</h2>
            <p className="text-gray-600 text-sm mt-1">
              {loading ? 'Loading...' : `${totalCount} events found`}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                  viewMode === 'table'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('json')}
                className={`px-4 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                  viewMode === 'json'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                JSON
              </button>
            </div>

            {/* Export Buttons */}
            {events.length > 0 && (
              <div className="flex space-x-2">
                <button
                  onClick={exportToCsv}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Export CSV
                </button>
                <button
                  onClick={exportToJson}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Export JSON
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Content */}
      <div className="p-6">
        {loading && events.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-gray-600">Loading events...</span>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or adding a contract address.</p>
          </div>
        ) : viewMode === 'table' ? (
          <>
            {/* Table View */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Block</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {events.map((event) => (
                    <>
                      <tr key={event.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">{event.eventName}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <a
                            href={getEtherscanUrl('block', event.blockNumber, event.network)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900 text-sm"
                          >
                            {event.blockNumber}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <a
                            href={getEtherscanUrl('tx', event.transactionHash, event.network)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900 text-sm font-mono"
                          >
                            {formatHash(event.transactionHash)}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <a
                            href={getEtherscanUrl('address', event.contractAddress, event.network)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900 text-sm font-mono"
                          >
                            {formatAddress(event.contractAddress)}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(event.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            {expandedEvent === event.id ? 'Hide' : 'Details'}
                          </button>
                        </td>
                      </tr>
                      {expandedEvent === event.id && (
                        <tr key={`${event.id}-details`}>
                          <td colSpan={6} className="px-6 py-4 bg-gray-50">
                            <div className="text-sm">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <strong>Event Signature:</strong>
                                  <p className="font-mono text-xs mt-1 break-all">{event.eventSignature}</p>
                                </div>
                                <div>
                                  <strong>Indexed Parameters:</strong>
                                  <pre className="text-xs mt-1 bg-white p-2 rounded border overflow-x-auto">
                                    {JSON.stringify(event.indexedParams, null, 2)}
                                  </pre>
                                </div>
                                <div className="col-span-2">
                                  <strong>Event Data:</strong>
                                  <pre className="text-xs mt-1 bg-white p-2 rounded border overflow-x-auto">
                                    {event.data}
                                  </pre>
                                </div>
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
          </>
        ) : (
          // JSON View
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-green-400 text-sm">
              {JSON.stringify(events, null, 2)}
            </pre>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages} ({totalCount} total)
              </span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!hasPreviousPage}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasNextPage}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
