import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GraphiQL Playground - Web3 Indexer",
  description: "Interactive GraphQL playground for Web3 indexer API",
};

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ margin: 0, padding: 0, overflow: 'hidden', height: '100vh', width: '100vw' }}>
      {children}
    </div>
  );
}
