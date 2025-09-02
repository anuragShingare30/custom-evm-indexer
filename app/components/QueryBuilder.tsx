'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_CONTRACTS, GET_EVENT_TYPES } from '@/app/lib/graphql-queries';

interface Contract {
  id: string;
  address: string;
  name?: string;
}

interface GetContractsResponse {
  getContracts: Contract[];
}

interface GetEventTypesResponse {
  getEventTypes: string[];
}

interface QueryFilters {
  contractAddress: string;
  eventName: string;
  network: string;
}

interface QueryBuilderProps {
  onFiltersChange: (filters: Partial<QueryFilters>) => void;
  onExecuteQuery: () => void;
  loading?: boolean;
}

export function QueryBuilder({ onFiltersChange, onExecuteQuery, loading = false }: QueryBuilderProps) {
  const [filters, setFilters] = useState<QueryFilters>({
    contractAddress: '',
    eventName: '',
    network: 'sepolia',
  });

  // Get contracts for dropdown
  const { data: contractsData, loading: contractsLoading } = useQuery<GetContractsResponse>(GET_CONTRACTS, {
    variables: { network: filters.network },
  });

  // Get event types based on selected contract or all events if no contract
  const { data: eventTypesData, loading: eventTypesLoading } = useQuery<GetEventTypesResponse>(GET_EVENT_TYPES, {
    variables: {
      contractAddress: filters.contractAddress || undefined,
      network: filters.network,
    },
    // Always fetch event types, don't skip
  });

  // Update parent component when filters change
  useEffect(() => {
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== '')
    );
    onFiltersChange(activeFilters);
  }, [filters, onFiltersChange]);

  const handleFilterChange = (key: keyof QueryFilters, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // Reset event name when contract changes
      if (key === 'contractAddress') {
        newFilters.eventName = '';
      }
      
      return newFilters;
    });
  };

  const handleReset = () => {
    setFilters({
      contractAddress: '',
      eventName: '',
      network: 'sepolia',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Query Builder</h2>
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Reset Filters
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Network Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Network
          </label>
          <select
            value={filters.network}
            onChange={(e) => handleFilterChange('network', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="sepolia">Sepolia</option>
            <option value="mainnet">Mainnet</option>
          </select>
        </div>

        {/* Contract Address Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contract Address
          </label>
          <select
            value={filters.contractAddress}
            onChange={(e) => handleFilterChange('contractAddress', e.target.value)}
            disabled={contractsLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-gray-900"
          >
            <option value="">All Contracts</option>
            {contractsData?.getContracts?.map((contract: Contract) => (
              <option key={contract.id} value={contract.address}>
                {contract.name || `${contract.address.slice(0, 10)}...`}
              </option>
            ))}
          </select>
          {contractsLoading && (
            <p className="text-xs text-gray-500 mt-1">Loading contracts...</p>
          )}
        </div>

        {/* Event Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Type
          </label>
          <select
            value={filters.eventName}
            onChange={(e) => handleFilterChange('eventName', e.target.value)}
            disabled={eventTypesLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-gray-900"
          >
            <option value="">All Events</option>
            {eventTypesData?.getEventTypes?.map((eventType: string) => (
              <option key={eventType} value={eventType}>
                {eventType}
              </option>
            ))}
          </select>
          {eventTypesLoading && (
            <p className="text-xs text-gray-500 mt-1">Loading events...</p>
          )}
        </div>
      </div>

      {/* Execute Query Button */}
      <div className="flex justify-center">
        <button
          onClick={onExecuteQuery}
          disabled={loading}
          className="px-8 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Executing Query...
            </span>
          ) : (
            'Execute Query'
          )}
        </button>
      </div>

      {/* Applied Filters Summary */}
      {Object.values(filters).some(value => value !== '') && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Applied Filters:</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(filters)
              .filter(([, value]) => value !== '')
              .map(([key, value]) => (
                <span
                  key={key}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {key}: {value}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
