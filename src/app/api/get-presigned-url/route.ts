import { NextRequest, NextResponse } from "next/server";
import { getPresignedUrl } from "@/lib/s3-client";
import { z } from "zod";

const PresignedURLSchema = z.object({
  s3Key: z.string().min(1, "S3 key required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { s3Key } = PresignedURLSchema.parse(body);

    console.log("[presigned-url] Generating presigned URL for:", s3Key);

    const url = await getPresignedUrl(s3Key, 3600); // 1 hour expiry

    console.log("[presigned-url] Generated URL");

    return NextResponse.json({
      url,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    });
  } catch (error) {
    console.error("[presigned-url] ERROR:", error);
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 }
    );
  }
}
