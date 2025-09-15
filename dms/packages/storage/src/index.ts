import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@dms/env/src/server";

const s3 = new S3Client({
  region: "us-east-1",
  endpoint: env.S3_ENDPOINT,
  forcePathStyle: env.S3_FORCE_PATH_STYLE === "true",
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY
  }
});

export async function uploadBuffer(key: string, buf: Buffer, contentType: string) {
  const cmd = new PutObjectCommand({
    Bucket: env.STORAGE_BUCKET,
    Key: key,
    Body: buf,
    ContentType: contentType
  });
  await s3.send(cmd);
  return `s3://${env.STORAGE_BUCKET}/${key}`;
}

export async function signedGetUrl(key: string, expiresSeconds = 900) {
  const cmd = new GetObjectCommand({
    Bucket: env.STORAGE_BUCKET,
    Key: key
  });
  return getSignedUrl(s3, cmd, { expiresIn: expiresSeconds });
}
