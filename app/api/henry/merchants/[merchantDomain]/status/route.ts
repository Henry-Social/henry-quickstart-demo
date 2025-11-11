import { type NextRequest, NextResponse } from "next/server";
import { henry } from "@/lib/henry";

export async function GET(
  _request: NextRequest,
  { params }: { params: { merchantDomain: string } },
) {
  try {
    const { merchantDomain } = params;

    const result = await henry.merchants.checkStatus(merchantDomain);
    return NextResponse.json(result);
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
