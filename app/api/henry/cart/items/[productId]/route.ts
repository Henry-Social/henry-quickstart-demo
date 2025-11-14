import { type NextRequest, NextResponse } from "next/server";
import { henry } from "@/lib/henry";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { productId: string } },
) {
  try {
    const userId = _request.headers.get("x-user-id") || "demo_user_123";
    const productId = params.productId ? decodeURIComponent(params.productId) : null;

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const result = await henry.cart.items.remove(productId, { "x-user-id": userId });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Remove cart item error:", error);
    return NextResponse.json({ error: "Failed to remove cart item" }, { status: 500 });
  }
}
