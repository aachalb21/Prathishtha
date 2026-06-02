import crypto from "crypto";

export function generateChecksum(data, secret) {
  const raw = `${data.merchantId}|${data.orderId}|${data.amount}|${process.env.BILLDESK_SECRET}`;

  return crypto.createHash("sha256").update(raw).digest("hex");
}
