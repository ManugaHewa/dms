import nodemailer from "nodemailer";
import { env } from "@dms/env/src/server";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false
});

export async function sendReceiptEmail(to: string, receiptNumber: string, downloadUrl: string) {
  await transporter.sendMail({
    from: "Temple DMS <no-reply@temple.test>",
    to,
    subject: `Your donation receipt ${receiptNumber}`,
    text: `Thank you for your donation.\nDownload your receipt: ${downloadUrl}`,
    html: `Thank you for your donation.<br/>Download your receipt: <a href="${downloadUrl}">${downloadUrl}</a>`
  });
}
