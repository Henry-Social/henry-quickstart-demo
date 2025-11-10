import { type NextRequest, NextResponse } from "next/server";
import { henry } from "@/lib/henry";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const result = await henry.products.retrieveDetails({ productId });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to get product details" }, { status: 500 });
  }
}
