import { NextRequest, NextResponse } from 'next/server';
import { BlockchainService } from '@/app/lib/blockchain';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const network = searchParams.get('network') || 'sepolia';

    const blockRange = await BlockchainService.getRecommendedBlockRange(network);

    return NextResponse.json({
      success: true,
      data: blockRange
    });
  } catch (error) {
    console.error('Error fetching latest block:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch latest block'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { network = 'sepolia' } = body;

    const blockRange = await BlockchainService.getRecommendedBlockRange(network);

    return NextResponse.json({
      success: true,
      data: blockRange
    });
  } catch (error) {
    console.error('Error fetching latest block:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch latest block'
    }, { status: 500 });
  }
}
