import { NextRequest, NextResponse } from 'next/server';
import { testComputeFlow } from '../../../../0g-compute-ts-starter-kit/demo-compute-flow';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    const response = await testComputeFlow(query);
    
    return NextResponse.json({ 
      success: true,
      response 
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'An error occurred' 
      },
      { status: 500 }
    );
  }
}

