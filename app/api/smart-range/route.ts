import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/app/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractAddress, network, eventName } = body;

    if (!contractAddress || !network) {
      return NextResponse.json({
        success: false,
        error: 'Contract address and network are required'
      }, { status: 400 });
    }

    // Get smart range info (just the range calculation, not the actual events)
    const result = await DatabaseService.getEventsSmartRange({
      contractAddress,
      network,
      eventName,
      limit: 1, // Just get range info, not actual events
      offset: 0,
    });

    return NextResponse.json({
      success: true,
      data: {
        rangeInfo: result.rangeInfo,
        totalEventsInRange: result.totalCount,
      }
    });
  } catch (error) {
    console.error('Error calculating smart range:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate smart range'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractAddress = searchParams.get('contractAddress');
    const network = searchParams.get('network') || 'sepolia';
    const eventName = searchParams.get('eventName') || undefined;

    if (!contractAddress) {
      return NextResponse.json({
        success: false,
        error: 'Contract address is required'
      }, { status: 400 });
    }

    // Get smart range info
    const result = await DatabaseService.getEventsSmartRange({
      contractAddress,
      network,
      eventName,
      limit: 1, // Just get range info
      offset: 0,
    });

    return NextResponse.json({
      success: true,
      data: {
        rangeInfo: result.rangeInfo,
        totalEventsInRange: result.totalCount,
      }
    });
  } catch (error) {
    console.error('Error calculating smart range:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate smart range'
    }, { status: 500 });
  }
}
