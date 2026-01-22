import { S3Client } from "@aws-sdk/client-s3";
import { GetObjectCommand, DeleteObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3 } from "@/lib/constants";

export const s3Client = new S3Client({
  region: process.env.AWS_REGION || S3.REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function getPresignedUrl(key: string, expiresIn: number = S3.PRESIGNED_URL_EXPIRY_SECONDS) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

export async function deleteFromS3(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
  });

  await s3Client.send(command);
}

export async function deleteMultipleFromS3(keys: string[]): Promise<void> {
  if (keys.length === 0) return;

  if (keys.length === 1) {
    return deleteFromS3(keys[0]);
  }

  const command = new DeleteObjectsCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Delete: {
      Objects: keys.map(key => ({ Key: key })),
      Quiet: true,
    },
  });

  const response = await s3Client.send(command);

  if (response.Errors && response.Errors.length > 0) {
    const errorKeys = response.Errors.map(e => e.Key).join(', ');
    throw new Error(`Failed to delete S3 objects: ${errorKeys}`);
  }
}
