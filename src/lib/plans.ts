export const planNames = { monthly: "شهري", annual: "سنوي", lifetime: "مدى الحياة" } as const;
export type PlanKey = keyof typeof planNames;

export function isPlanKey(value: unknown): value is PlanKey {
  return typeof value === "string" && value in planNames;
}

export function configuredPlanPrice(plan: PlanKey) {
  const envKey = { monthly: "SRVS_PRICE_MONTHLY_EGP", annual: "SRVS_PRICE_ANNUAL_EGP", lifetime: "SRVS_PRICE_LIFETIME_EGP" }[plan];
  const amount = process.env[envKey]?.trim() ?? "";
  if (!/^\d{1,8}(?:\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) return null;
  return amount;
}

export function toMinorUnits(amount: string) {
  if (!/^\d+(?:\.\d{1,2})?$/.test(amount)) throw new Error("Invalid amount");
  const [whole, fraction = ""] = amount.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}
