import { SaveFileSchema } from "@/lib/zod-schemas";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import z from "zod";
import { files } from "@/db/schema";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  console.log(session);

  if (!session?.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const { s3Key, fileName, fileSize, contentType, userId } =
    SaveFileSchema.parse(body);

  if (userId !== session?.user.id) {
    return NextResponse.json(
      { error: "You do not have access to this file" },
      { status: 403 }
    );
  }

  try {
    await db.insert(files).values({
      userId,
      s3Key,
      fileName,
      fileSize,
      contentType,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to save file to database" },
      { status: 500 }
    );
  }
}
