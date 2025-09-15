import { Queue } from "bullmq";
import IORedis from "ioredis";
import { env } from "@dms/env/src/server";

export const connection = new IORedis(env.REDIS_URL);
export const receiptQueue = new Queue("receipts", { connection });
