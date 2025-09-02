import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    message: 'GraphQL Debug Info',
    introspectionEnabled: true,
    csrfDisabled: true,
    version: '1.0.0'
  });
}
