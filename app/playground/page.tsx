import { PostMessageGraphiQLPlayground } from '../components/PostMessageGraphiQLPlayground';

export default function PlaygroundPage() {
  return (
    <div 
      className="fixed inset-0 w-full h-full"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1000
      }}
    >
      <PostMessageGraphiQLPlayground />
    </div>
  );
}

export const metadata = {
  title: 'GraphQL Playground - Web3 Indexer',
  description: 'Interactive GraphQL query playground for blockchain event indexing',
};
