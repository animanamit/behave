import { NextRequest, NextResponse } from "next/server";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3-client";
import { PresignedURLRequestSchema } from "@/lib/zod-schemas";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, contentType } = PresignedURLRequestSchema.parse(body);

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

    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `${Date.now()}-${sanitizedFileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      ContentType: contentType,
    });

    const uploadURL = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });
    return NextResponse.json({ uploadURL: uploadURL, s3Key: key });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Failed to generate presigned URL: ", error);
    return NextResponse.json(
      {
        error: "Failed to generate upload URL",
      },
      {
        status: 500,
      }
    );
  }
}
