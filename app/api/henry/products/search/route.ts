import { NextRequest, NextResponse } from 'next/server';
import { HENRY_API_URL, HENRY_API_KEY } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const searchBody = {
      ...body,
      limit: 10
    };
    
    const response = await fetch(`${HENRY_API_URL}/products/search`, {
      method: 'POST',
      headers: {
        'x-api-key': HENRY_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchBody),
    });

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    );
  }
}
