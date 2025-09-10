import { NextRequest, NextResponse } from 'next/server';
import { HENRY_API_URL, HENRY_API_KEY } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo_user_123';
    
    const response = await fetch(`${HENRY_API_URL}/wallet/card-collect-guest`, {
      method: 'POST',
      headers: {
        'x-api-key': HENRY_API_KEY,
        'x-user-id': userId,
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Guest card collect error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate guest card collection' },
      { status: 500 }
    );
  }
}