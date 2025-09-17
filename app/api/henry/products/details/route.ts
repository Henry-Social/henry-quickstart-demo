import { type NextRequest, NextResponse } from "next/server";
import { HENRY_API_KEY, HENRY_API_URL } from "@/lib/config";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const response = await fetch(`${HENRY_API_URL}/products/details?productId=${productId}`, {
      headers: {
        "x-api-key": HENRY_API_KEY,
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to get product details" }, { status: 500 });
  }
}
