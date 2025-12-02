import { type NextRequest, NextResponse } from "next/server";
import { henry } from "@/lib/henry";

export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id") || "demo_user_123";
    const result = await henry.cart.items.list({ "x-user-id": userId });
    return NextResponse.json(result, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("Fetch cart items error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart items" },
      { status: 500, headers: NO_CACHE_HEADERS },
    );
  }
}
