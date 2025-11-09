import { NextRequest, NextResponse } from "next/server";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3-client";
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { fileName, contentType } = body;

  if (!process.env.AWS_S3_BUCKET) {
    return NextResponse.json(
      {
        error: "S3 bucket not configured in env variables",
      },
      {
        status: 500,
      }
    );
  }
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: fileName,
    ContentType: contentType,
  });

  const uploadURL = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  return NextResponse.json({ uploadURL: uploadURL });
}
