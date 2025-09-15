import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { prisma } from "@dms/db/src/client";
import { DonationInput } from "@dms/core/src/zod/donation";
import { DonorInput } from "@dms/core/src/zod/donor";
import { receiptQueue } from "./queues";

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Fake auth middleware for now
app.use((req, _res, next) => {
  // In real auth, set req.user from session or token
  (req as any).user = { id: "dev", role: "ACCOUNTANT" };
  next();
});

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/donors", async (req, res) => {
  const parsed = DonorInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const donor = await prisma.donor.create({ data: parsed.data });
  res.json(donor);
});

app.post("/donations", async (req, res) => {
  const parsed = DonationInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const data = parsed.data;
  const gross = data.grossAmount;
  const fee = data.processorFee ?? 0;
  const net = Number((gross - fee).toFixed(2));

  const donation = await prisma.donation.create({
    data: {
      donorId: data.donorId ?? null,
      causeId: data.causeId,
      type: data.type,
      currency: data.currency,
      grossAmount: gross,
      processorFee: data.processorFee ?? null,
      netAmount: net,
      status: "PENDING_VALIDATION",
      remarksDonor: data.remarksDonor
    }
  });

  res.json(donation);
});

function nextReceiptNumber() {
  // Simple placeholder. Replace with proper year based series.
  return "R-" + Math.floor(100000 + Math.random() * 900000).toString();
}

app.patch("/donations/:id/validate", async (req, res) => {
  const donationId = req.params.id;

  const donation = await prisma.$transaction(async tx => {
    const d = await tx.donation.update({
      where: { id: donationId },
      data: { status: "VALIDATED", dateVerified: new Date() }
    });
    await tx.receipt.create({
      data: {
        donationId: d.id,
        receiptNumber: nextReceiptNumber()
      }
    });
    return d;
  });

  await receiptQueue.add("generate", { donationId: donation.id });

  res.json({ ok: true, donationId: donation.id });
});

const port = 4000;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
