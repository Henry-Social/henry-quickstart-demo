import { type NextRequest, NextResponse } from "next/server";
import { henry } from "@/lib/henry";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const searchBody = { ...body, limit: 10 };

    const result = await henry.products.search(searchBody);
    return NextResponse.json(result);
  } catch (_error) {
    return NextResponse.json({ error: "Failed to search products" }, { status: 500 });
  }
}
