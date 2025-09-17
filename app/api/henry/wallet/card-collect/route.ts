import { type NextRequest, NextResponse } from "next/server";
import { HENRY_API_KEY, HENRY_API_URL } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id") || "demo_user_123";

    const response = await fetch(`${HENRY_API_URL}/wallet/card-collect`, {
      method: "POST",
      headers: {
        "x-api-key": HENRY_API_KEY,
        "x-user-id": userId,
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Card collect error:", error);
    return NextResponse.json({ error: "Failed to initiate card collection" }, { status: 500 });
  }
}
