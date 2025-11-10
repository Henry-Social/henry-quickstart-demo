import { type NextRequest, NextResponse } from "next/server";
import { henry } from "@/lib/henry";

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id") || "demo_user_123";

    const result = await henry.wallet.createCardCollection({ "x-user-id": userId, auth: false });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Guest card collect error:", error);
    return NextResponse.json(
      { error: "Failed to initiate guest card collection" },
      { status: 500 },
    );
  }
}
