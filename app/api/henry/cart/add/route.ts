import { NextRequest, NextResponse } from 'next/server';
import { HENRY_API_URL, HENRY_API_KEY } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.headers.get('x-user-id') || 'demo_user_123';
    
    const response = await fetch(`${HENRY_API_URL}/cart/items`, {
      method: 'POST',
      headers: {
        'x-api-key': HENRY_API_KEY,
        'x-user-id': userId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Add to cart error:', error);
    return NextResponse.json(
      { error: 'Failed to add to cart' },
      { status: 500 }
    );
  }
}
