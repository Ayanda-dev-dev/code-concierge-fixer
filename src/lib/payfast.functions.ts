import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHash } from "node:crypto";

// PayFast field order matters for the signature.
// Fields must be concatenated in the order they appear on the form.
const FIELD_ORDER = [
  "merchant_id",
  "merchant_key",
  "return_url",
  "cancel_url",
  "notify_url",
  "name_first",
  "name_last",
  "email_address",
  "m_payment_id",
  "amount",
  "item_name",
  "item_description",
] as const;

function payfastEncode(value: string): string {
  // PayFast: URL-encode using upper-case hex, replace %20 with +.
  return encodeURIComponent(value).replace(/%[0-9a-f]{2}/g, (m) => m.toUpperCase()).replace(/%20/g, "+");
}

function buildSignature(fields: Record<string, string>, passphrase: string): string {
  const parts: string[] = [];
  for (const key of FIELD_ORDER) {
    const v = fields[key];
    if (v !== undefined && v !== "") parts.push(`${key}=${payfastEncode(v)}`);
  }
  let str = parts.join("&");
  if (passphrase) str += `&passphrase=${payfastEncode(passphrase)}`;
  return createHash("md5").update(str).digest("hex");
}

export const createPayfastCheckout = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      appId: z.string().min(1),
      amount: z.number().positive(),
      itemName: z.string().min(1),
      itemDescription: z.string().optional(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().email().optional(),
      origin: z.string().url(),
    }),
  )
  .handler(async ({ data }) => {
    const merchantId = process.env.PAYFAST_MERCHANT_ID ?? "10000100";
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY ?? "46f0cd694581a";
    const passphrase = process.env.PAYFAST_PASSPHRASE ?? "";
    const sandbox = (process.env.PAYFAST_SANDBOX ?? "true").toLowerCase() !== "false";

    const fields: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${data.origin}/apply/${data.appId}?payment=success`,
      cancel_url: `${data.origin}/apply/${data.appId}?payment=cancelled`,
      notify_url: `${data.origin}/api/public/payfast/notify`,
      name_first: data.firstName ?? "",
      name_last: data.lastName ?? "",
      email_address: data.email ?? "",
      m_payment_id: data.appId,
      amount: data.amount.toFixed(2),
      item_name: data.itemName,
      item_description: data.itemDescription ?? "",
    };

    const signature = buildSignature(fields, passphrase);
    const action = sandbox
      ? "https://sandbox.payfast.co.za/eng/process"
      : "https://www.payfast.co.za/eng/process";

    // Only return non-empty fields (matches what we sign).
    const formFields: Record<string, string> = {};
    for (const key of FIELD_ORDER) {
      if (fields[key]) formFields[key] = fields[key];
    }
    formFields.signature = signature;

    return { action, fields: formFields, sandbox };
  });
