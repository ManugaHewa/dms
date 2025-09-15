import { z } from "zod";

const ServerEnv = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.coerce.number().default(1025),
  STORAGE_KIND: z.enum(["s3"]).default("s3"),
  STORAGE_BUCKET: z.string().default("dms-receipts"),
  S3_ENDPOINT: z.string().default("http://localhost:9000"),
  S3_ACCESS_KEY: z.string().default("minio"),
  S3_SECRET_KEY: z.string().default("minio123"),
  S3_FORCE_PATH_STYLE: z
    .enum(["true", "false"])
    .default("true"),
  JWT_SECRET: z.string().min(16).default("dev_jwt_secret_change_me")
});

export const env = ServerEnv.parse(process.env);
