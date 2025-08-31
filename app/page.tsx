"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import EventsDisplay from "@/components/EventsDisplay";

interface IndexerFormData {
  contractAddress: string;
  contractABI: string;
  eventsToTrack: string[];
  network: 'mainnet' | 'sepolia';
  fromBlock: string;
  toBlock: string;
}

interface EventLog {
  address: string;
  topics: string[];
  data: string;
  blockNumber: string; // Now string instead of bigint
  transactionHash: string;
  transactionIndex: string; // Now string instead of bigint
  blockHash: string;
  logIndex: string; // Now string instead of bigint
  removed: boolean;
  eventName?: string;
}

interface IndexerResponse {
  success: boolean;
  events?: EventLog[];
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

export default function Dashboard() {
  const [isListening, setIsListening] = useState(false);
  const [submittedData, setSubmittedData] = useState<IndexerFormData | null>(null);
  const [events, setEvents] = useState<string[]>([]);
  const [currentEvent, setCurrentEvent] = useState("");
  const [indexerResults, setIndexerResults] = useState<IndexerResponse | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<IndexerFormData>({
    defaultValues: {
      network: 'sepolia',
      fromBlock: '6000000', // More recent blocks for faster testing
      toBlock: 'latest'
    }
  });

  const addEvent = (eventName: string) => {
    if (eventName.trim() && !events.includes(eventName.trim())) {
      const newEvents = [...events, eventName.trim()];
      setEvents(newEvents);
      setValue("eventsToTrack", newEvents);
      setCurrentEvent("");
    }
  };

  const removeEvent = (eventToRemove: string) => {
    const newEvents = events.filter(event => event !== eventToRemove);
    setEvents(newEvents);
    setValue("eventsToTrack", newEvents);
  };

  const handleEventKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addEvent(currentEvent);
    }
  };

  const onSubmit = async (data: IndexerFormData) => {
    try {
      setIsLoadingEvents(true);
      
      const formDataWithEvents = {
        ...data,
        eventsToTrack: events
      };
      
      setSubmittedData(formDataWithEvents);
      setIsListening(true);
      
      // Call the indexer API
      const response = await fetch('/api/indexer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formDataWithEvents),
      });
      
      const result: IndexerResponse = await response.json();
      setIndexerResults(result);
      
      if (!result.success) {
        console.error('Indexer Error:', result.error);
      } else {
        console.log('Indexer Success:', result);
      }
      
    } catch (error) {
      console.error("Error calling indexer:", error);
      setIndexerResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const stopListening = () => {
    setIsListening(false);
    setSubmittedData(null);
    setEvents([]);
    setCurrentEvent("");
    setIndexerResults(null);
    reset();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Web3 Indexer Dashboard</h1>
            <p className="text-gray-600 mt-1">Configure blockchain event indexing with database persistence</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Configuration Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Indexer Configuration</h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Contract Address */}
              <div>
                <label htmlFor="contractAddress" className="block text-sm font-medium text-black mb-2">
                  Contract Address
                </label>
                <input
                  {...register("contractAddress", {
                    required: "Contract address is required",
                    pattern: {
                      value: /^0x[a-fA-F0-9]{40}$/,
                      message: "Please enter a valid Ethereum address"
                    }
                  })}
                  type="text"
                  placeholder="0x..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  disabled={isListening}
                />
                {errors.contractAddress && (
                  <p className="mt-1 text-sm text-red-600">{errors.contractAddress.message}</p>
                )}
              </div>

              {/* Contract ABI */}
              <div>
                <label htmlFor="contractABI" className="block text-sm font-medium text-black mb-2">
                  Contract ABI (JSON)
                </label>
                <textarea
                  {...register("contractABI", {
                    required: "Contract ABI is required",
                    validate: (value) => {
                      try {
                        JSON.parse(value);
                        return true;
                      } catch {
                        return "Please enter valid JSON";
                      }
                    }
                  })}
                  rows={6}
                  placeholder='[{"inputs":[],"name":"Transfer","type":"event",...}]'
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm text-black"
                  disabled={isListening}
                />
                {errors.contractABI && (
                  <p className="mt-1 text-sm text-red-600">{errors.contractABI.message}</p>
                )}
              </div>

              {/* Events to Track */}
              <div>
                <label htmlFor="eventsToTrack" className="block text-sm font-medium text-black mb-2">
                  Events to Track
                </label>
                
                {/* Event Input */}
                <input
                  type="text"
                  value={currentEvent}
                  onChange={(e) => setCurrentEvent(e.target.value)}
                  onKeyPress={handleEventKeyPress}
                  placeholder="Enter event name and press Enter"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  disabled={isListening}
                />
                
                {/* Display Added Events */}
                {events.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {events.map((event, index) => (
                      <span 
                        key={index} 
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {event}
                        {!isListening && (
                          <button
                            type="button"
                            onClick={() => removeEvent(event)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Hidden input for form validation */}
                <input
                  {...register("eventsToTrack", {
                    validate: () => events.length > 0 || "At least one event is required"
                  })}
                  type="hidden"
                  value={events}
                />
                
                {errors.eventsToTrack && (
                  <p className="mt-1 text-sm text-red-600">{errors.eventsToTrack.message}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Type an event name and press Enter to add it
                </p>
              </div>

              {/* Network Selection */}
              <div>
                <label htmlFor="network" className="block text-sm font-medium text-black mb-2">
                  Network
                </label>
                <select
                  {...register("network", {
                    required: "Network selection is required"
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  disabled={isListening}
                >
                  <option value="sepolia">Sepolia Testnet</option>
                  <option value="mainnet">Ethereum Mainnet</option>
                </select>
                {errors.network && (
                  <p className="mt-1 text-sm text-red-600">{errors.network.message}</p>
                )}
              </div>

              {/* Block Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fromBlock" className="block text-sm font-medium text-black mb-2">
                    From Block
                  </label>
                  <input
                    {...register("fromBlock", {
                      required: "From block is required"
                    })}
                    type="text"
                    placeholder="6000000 (or 'earliest')"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    disabled={isListening}
                  />
                  {errors.fromBlock && (
                    <p className="mt-1 text-sm text-red-600">{errors.fromBlock.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="toBlock" className="block text-sm font-medium text-black mb-2">
                    To Block
                  </label>
                  <input
                    {...register("toBlock", {
                      required: "To block is required"
                    })}
                    type="text"
                    placeholder="latest (or block number)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    disabled={isListening}
                  />
                  {errors.toBlock && (
                    <p className="mt-1 text-sm text-red-600">{errors.toBlock.message}</p>
                  )}
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800 text-sm">
                  <strong>Tip:</strong> For faster results, use a smaller block range (e.g., last 10,000 blocks). 
                  Large ranges from &ldquo;earliest&rdquo; may take several minutes to process.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                {!isListening ? (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? "Starting Indexer..." : "Start Indexing"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopListening}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                  >
                    Stop Indexing
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Status Panel */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Indexer Status</h2>
            
            {!isListening ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Index</h3>
                <p className="text-gray-600">Configure your contract details and start indexing blockchain events</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                  <span className="text-green-600 font-medium">Indexing Active</span>
                </div>
                
                {submittedData && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-black">Contract Address:</h4>
                      <p className="text-sm text-gray-600 font-mono break-all">{submittedData.contractAddress}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-black">Events Tracking:</h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {submittedData.eventsToTrack.map((event: string, index: number) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {event}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Events Display Section */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-black">Indexed Events</h2>
            <p className="text-gray-600 mt-1">Real-time blockchain events captured by the indexer</p>
          </div>
          
          <div className="p-6">
            <EventsDisplay 
              events={indexerResults?.events || []}
              isLoading={isLoadingEvents}
              error={indexerResults?.success === false ? indexerResults.error : undefined}
              metadata={indexerResults?.metadata}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
