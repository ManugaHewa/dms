import { Worker } from "bullmq";
import IORedis from "ioredis";
import { prisma } from "@dms/db/src/client";
import { env } from "@dms/env/src/server";
import { uploadBuffer, signedGetUrl } from "@dms/storage/src";
import { sendReceiptEmail } from "@dms/email/src";
import PDFDocument from "pdfkit";

const connection = new IORedis(env.REDIS_URL);

function renderReceiptPdf(receiptNumber: string, amount: number, donorName: string) {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks: Buffer[] = [];
  doc.on("data", chunk => chunks.push(chunk));
  return new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    doc.fontSize(18).text("Temple Donation Receipt", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Receipt Number: ${receiptNumber}`);
    doc.text(`Donor: ${donorName || "Anonymous"}`);
    doc.text(`Amount: CAD ${amount.toFixed(2)}`);
    doc.text(`Issued: ${new Date().toISOString()}`);
    doc.moveDown();
    doc.text("Thank you for your support.");
    doc.end();
  });
}

new Worker("receipts", async job => {
  const { donationId } = job.data as { donationId: string };

  const donation = await prisma.donation.findUnique({
    where: { id: donationId },
    include: { receipt: true, donor: true }
  });
  if (!donation || !donation.receipt) return;

  const receiptNumber = donation.receipt.receiptNumber;
  const donorName = donation.donor ? `${donation.donor.firstName} ${donation.donor.lastName}` : "Anonymous";
  const pdf = await renderReceiptPdf(receiptNumber, Number(donation.netAmount), donorName);

  const key = `receipts/${receiptNumber}.pdf`;
  await uploadBuffer(key, pdf, "application/pdf");

  // Save URL in DB (store key only in real apps)
  await prisma.receipt.update({
    where: { donationId: donation.id },
    data: { pdfUrl: key }
  });

  if (donation.donor?.email) {
    const url = await signedGetUrl(key, 3600);
    await sendReceiptEmail(donation.donor.email, receiptNumber, url);
  }

  console.log(`Generated and stored receipt ${receiptNumber} for donation ${donation.id}`);
}, { connection });

console.log("Worker listening to 'receipts' queue");
