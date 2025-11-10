import { type NextRequest, NextResponse } from "next/server";
import { henry } from "@/lib/henry";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.headers.get("x-user-id") || "demo_user_123";

    const result = await henry.cart.items.add({ ...body, "x-user-id": userId });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Add to cart error:", error);
    return NextResponse.json({ error: "Failed to add to cart" }, { status: 500 });
  }
}
