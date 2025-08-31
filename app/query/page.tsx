'use client';

import { useState, useCallback } from 'react';
import { QueryBuilder } from '../components/QueryBuilder';
import { ResultsDisplay } from '../components/ResultsDisplay';

interface QueryFilters {
  contractAddress?: string;
  eventName?: string;
  network?: string;
  fromBlock?: string;
  toBlock?: string;
  fromDate?: string;
  toDate?: string;
}

export default function QueryInterface() {
  const [filters, setFilters] = useState<QueryFilters>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleFiltersChange = useCallback((newFilters: Partial<QueryFilters>) => {
    setFilters(newFilters);
  }, []);

  const handleExecuteQuery = useCallback(() => {
    setIsExecuting(true);
    // Trigger refresh of results
    setRefreshTrigger(prev => prev + 1);
    
    // Reset executing state after a brief delay
    setTimeout(() => {
      setIsExecuting(false);
    }, 1000);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Web3 Indexer</h1>
              <p className="text-gray-600 mt-1">Interactive blockchain event query builder</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-600">GraphQL API Active</span>
              </div>
              
              <a
                href="/api/graphql"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md hover:bg-blue-50"
              >
                GraphQL Playground
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Query Builder */}
        <QueryBuilder 
          onFiltersChange={handleFiltersChange}
          onExecuteQuery={handleExecuteQuery}
          loading={isExecuting}
        />
        
        {/* Results */}
        <ResultsDisplay 
          filters={filters}
          refreshTrigger={refreshTrigger}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Powered by Apollo GraphQL, Prisma, and Viem
            </div>
            
            <div className="flex space-x-6 text-sm text-gray-500">
              <span>Network: Ethereum Sepolia</span>
              <span>•</span>
              <span>Real-time Event Indexing</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
