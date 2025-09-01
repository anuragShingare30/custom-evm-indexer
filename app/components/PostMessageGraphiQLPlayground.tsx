'use client';

import { useEffect, useRef, useState } from 'react';

// GraphiQL playground that communicates with parent via postMessage
export function PostMessageGraphiQLPlayground() {
  const [iframeContent, setIframeContent] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // GraphQL fetcher that runs in the parent context
  const graphQLFetcher = async (params: {
    query: string;
    variables?: Record<string, unknown>;
    operationName?: string;
  }) => {
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('GraphQL fetch error:', error);
      return {
        errors: [{
          message: error instanceof Error ? error.message : 'Network error occurred'
        }]
      };
    }
  };

  useEffect(() => {
    // Listen for messages from iframe
    const handleMessage = async (event: MessageEvent) => {
      if (event.data.type === 'GRAPHQL_QUERY') {
        const result = await graphQLFetcher(event.data.params);
        
        // Send result back to iframe
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage({
            type: 'GRAPHQL_RESULT',
            id: event.data.id,
            result
          }, '*');
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  useEffect(() => {
    // Create HTML content with GraphiQL embedded
    const graphiqlHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>GraphiQL Playground</title>
    <style>
        body {
            height: 100vh;
            margin: 0;
            padding: 0;
            overflow: hidden;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        #graphiql {
            height: 100vh;
            width: 100vw;
        }
        .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-size: 18px;
            color: #666;
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            animation: spin 2s linear infinite;
            margin-right: 15px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
    <link rel="stylesheet" href="https://unpkg.com/graphiql@3.4.0/graphiql.min.css" />
</head>
<body>
    <div id="loading" class="loading">
        <div class="spinner"></div>
        <span>Loading GraphiQL...</span>
    </div>
    <div id="graphiql"></div>

    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/graphiql@3.4.0/graphiql.min.js"></script>
    
    <script>
        let queryId = 0;
        const pendingQueries = new Map();
        
        // Create fetcher that uses postMessage
        function createGraphQLFetcher() {
            return async function(params) {
                return new Promise((resolve) => {
                    const id = ++queryId;
                    pendingQueries.set(id, resolve);
                    
                    // Send query to parent
                    window.parent.postMessage({
                        type: 'GRAPHQL_QUERY',
                        id: id,
                        params: params
                    }, '*');
                });
            };
        }

        // Listen for responses from parent
        window.addEventListener('message', function(event) {
            if (event.data.type === 'GRAPHQL_RESULT') {
                const resolve = pendingQueries.get(event.data.id);
                if (resolve) {
                    pendingQueries.delete(event.data.id);
                    resolve(event.data.result);
                }
            }
        });

        const defaultQuery = \`# Welcome to GraphiQL - Interactive GraphQL Query Explorer
# 
# Here are some example queries to get you started:

# 1. Get all contracts
query GetContracts {
  getContracts(network: "sepolia") {
    id
    address
    name
    network
    createdAt
    updatedAt
  }
}

# 2. Get events with pagination
query GetEvents {
  getEvents(
    filters: {
      network: "sepolia"
    }
    pagination: {
      page: 1
      limit: 10
    }
  ) {
    events {
      id
      eventName
      blockNumber
      transactionHash
      contractAddress
      createdAt
    }
    totalCount
    hasNextPage
    hasPreviousPage
    currentPage
    totalPages
  }
}

# 3. Get events by contract
query GetEventsByContract {
  getEventsByContract(
    contractAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
    network: "sepolia"
    pagination: {
      page: 1
      limit: 5
    }
  ) {
    events {
      id
      eventName
      blockNumber
      transactionHash
      data
      indexedParams
    }
    totalCount
  }
}

# 4. Get indexing status
query GetIndexingStatus {
  getIndexingStatus(network: "sepolia") {
    id
    contractAddress
    network
    lastIndexedBlock
    createdAt
    updatedAt
  }
}

# Tips:
# - Use Ctrl+Space for auto-completion
# - Use Ctrl+Enter to execute queries
# - Explore the schema using the Documentation Explorer (right panel)
# - Variables can be added in the Query Variables panel below
\`;

        // Wait for GraphiQL to be available
        function initializeGraphiQL() {
            if (typeof GraphiQL !== 'undefined' && typeof React !== 'undefined' && typeof ReactDOM !== 'undefined') {
                document.getElementById('loading').style.display = 'none';
                
                const root = ReactDOM.createRoot(document.getElementById('graphiql'));
                root.render(
                    React.createElement(GraphiQL, {
                        fetcher: createGraphQLFetcher(),
                        defaultQuery: defaultQuery,
                        style: { height: '100vh', width: '100vw' }
                    })
                );
            } else {
                setTimeout(initializeGraphiQL, 100);
            }
        }

        // Start initialization when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeGraphiQL);
        } else {
            initializeGraphiQL();
        }
    </script>
</body>
</html>`;

    setIframeContent(graphiqlHTML);
  }, []);

  useEffect(() => {
    if (iframeRef.current && iframeContent) {
      const iframe = iframeRef.current;
      const blob = new Blob([iframeContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      iframe.src = url;

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [iframeContent]);

  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
      <iframe
        ref={iframeRef}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          margin: 0,
          padding: 0,
        }}
        title="GraphiQL Playground"
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </div>
  );
}
