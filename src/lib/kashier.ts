import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyKashierWebhook(data: Record<string, unknown>, header: string | null) {
  const paymentApiKey = process.env.KASHIER_API_KEY;
  if (!paymentApiKey || !header || !/^[\da-f]{64}$/i.test(header) || !Array.isArray(data.signatureKeys)) return false;
  const keys = data.signatureKeys.filter((key): key is string => typeof key === "string").sort();
  if (keys.length === 0 || keys.length !== data.signatureKeys.length || keys.some((key) => !Object.hasOwn(data, key))) return false;
  const payload = keys.map((key) => `${key}=${encodeURIComponent(String(data[key] ?? ""))}`).join("&");
  const expected = Buffer.from(createHmac("sha256", paymentApiKey).update(payload).digest("hex"), "hex");
  let received: Buffer;
  try { received = Buffer.from(header, "hex"); } catch { return false; }
  return received.length === expected.length && timingSafeEqual(expected, received);
}

export function getKashierApiBase() {
  return process.env.KASHIER_MODE === "live" ? "https://api.kashier.io" : "https://test-api.kashier.io";
}
