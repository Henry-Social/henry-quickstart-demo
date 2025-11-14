import { type NextRequest, NextResponse } from "next/server";
import { henry } from "@/lib/henry";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const variantId = searchParams.get("variantId");

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        {
          status: 400,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const query: { productId: string; variantId?: string } = variantId
      ? { productId, variantId }
      : { productId };
    // Henry's API accepts an optional variantId even though the current SDK types do not expose it.
    const result = await henry.products.retrieveDetails(query);
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to get product details" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
