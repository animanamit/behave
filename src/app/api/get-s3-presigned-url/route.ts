import { NextRequest, NextResponse } from "next/server";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3-client";
import { PresignedURLRequestSchema } from "@/lib/zod-schemas";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { S3 } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    // Get session from auth headers
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fileName, contentType, userId } = PresignedURLRequestSchema.parse(body);

    // Verify that the requested userId matches the logged-in user
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: Cannot upload files for another user" },
        { status: 403 }
      );
    }

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
    const key = `documents/${userId}/${Date.now()}-${sanitizedFileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      ContentType: contentType,
    });

    const uploadURL = await getSignedUrl(s3Client, command, {
      expiresIn: S3.PRESIGNED_URL_EXPIRY_SECONDS,
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
