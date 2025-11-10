import { type NextRequest, NextResponse } from "next/server";
import { henry } from "@/lib/henry";

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id") || "demo_user_123";

    const result = await henry.cart.createCheckout({ "x-user-id": userId, auth: true });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 });
  }
}
