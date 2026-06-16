// PayFast ITN (Instant Transaction Notification) receiver.
//
// PayFast POSTs payment results here. We:
//   1. Validate the MD5 signature against our passphrase.
//   2. (Optional) Verify the payload by POSTing it back to PayFast.
//   3. Acknowledge with HTTP 200.
//
// For now, the client also marks the application as paid on the return_url
// callback (the user owns their own Firestore application doc). Server-side
// Firestore writes from this ITN would require Firebase Admin credentials —
// the FIREBASE_SERVICE_ACCOUNT_JSON secret is in place for a future slice.

import { createFileRoute } from "@tanstack/react-router";
import { createHash } from "node:crypto";

const FIELD_ORDER_FOR_SIGNATURE: string[] = [];

function payfastEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/%[0-9a-f]{2}/g, (m) => m.toUpperCase())
    .replace(/%20/g, "+");
}

function verifySignature(params: Record<string, string>, passphrase: string): boolean {
  const provided = params["signature"];
  if (!provided) return false;
  // Per PayFast ITN docs: concatenate all posted variables (except 'signature')
  // in the order they were posted.
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (k === "signature") continue;
    if (v === undefined || v === "") continue;
    parts.push(`${k}=${payfastEncode(v)}`);
  }
  let str = parts.join("&");
  if (passphrase) str += `&passphrase=${payfastEncode(passphrase)}`;
  const computed = createHash("md5").update(str).digest("hex");
  return computed.toLowerCase() === provided.toLowerCase();
}

async function verifyWithPayfast(rawBody: string, sandbox: boolean): Promise<boolean> {
  const url = sandbox
    ? "https://sandbox.payfast.co.za/eng/query/validate"
    : "https://www.payfast.co.za/eng/query/validate";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: rawBody,
    });
    const txt = (await res.text()).trim();
    return txt === "VALID";
  } catch {
    return false;
  }
}

void FIELD_ORDER_FOR_SIGNATURE;

export const Route = createFileRoute("/api/public/payfast/notify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const params: Record<string, string> = {};
        for (const [k, v] of new URLSearchParams(rawBody).entries()) params[k] = v;

        const passphrase = process.env.PAYFAST_PASSPHRASE ?? "";
        const sandbox = (process.env.PAYFAST_SANDBOX ?? "true").toLowerCase() !== "false";

        const sigOk = verifySignature(params, passphrase);
        const upstreamOk = await verifyWithPayfast(rawBody, sandbox);

        if (!sigOk || !upstreamOk) {
          console.warn("[payfast/notify] rejected", {
            sigOk,
            upstreamOk,
            m_payment_id: params["m_payment_id"],
            payment_status: params["payment_status"],
          });
          return new Response("Invalid", { status: 400 });
        }

        console.log("[payfast/notify] verified", {
          m_payment_id: params["m_payment_id"],
          pf_payment_id: params["pf_payment_id"],
          payment_status: params["payment_status"],
          amount_gross: params["amount_gross"],
        });

        // PayFast expects a 200 OK with no body.
        return new Response(null, { status: 200 });
      },
    },
  },
});
