import { type NextRequest, NextResponse } from "next/server";
import { henry } from "@/lib/henry";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id") || "demo_user_123";
    const result = await henry.cart.items.list({ "x-user-id": userId });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Fetch cart items error:", error);
    return NextResponse.json({ error: "Failed to fetch cart items" }, { status: 500 });
  }
}
