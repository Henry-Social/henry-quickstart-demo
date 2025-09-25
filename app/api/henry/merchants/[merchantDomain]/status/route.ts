import { type NextRequest, NextResponse } from "next/server";
import { HENRY_API_KEY, HENRY_API_URL } from "@/lib/config";

export async function GET(
  request: NextRequest,
  { params }: { params: { merchantDomain: string } },
) {
  try {
    const { merchantDomain } = params;
    const userId = request.headers.get("x-user-id") || "demo_user_123";

    const response = await fetch(`${HENRY_API_URL}/merchants/${merchantDomain}/status`, {
      method: "GET",
      headers: {
        "x-api-key": HENRY_API_KEY,
        "x-user-id": userId,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Merchant status check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check merchant status",
        data: { merchantSupportStatus: false },
      },
      { status: 500 },
    );
  }
}
