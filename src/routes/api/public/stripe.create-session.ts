// Creates a Stripe Checkout Session for an application fee.
//
// Returns { url } that the browser can redirect (or open) to. The success_url
// brings the user back to /apply/:appId with ?step=payment&payment=success
// so the wizard restores the Payment step and auto-verifies.

import { createFileRoute } from "@tanstack/react-router";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

type Body = {
  appId?: unknown;
  type?: unknown;
  fee?: unknown; // Rand amount
  email?: unknown;
};

export const Route = createFileRoute("/api/public/stripe/create-session")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, { status: 204, headers: CORS_HEADERS }),

      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as Body | null;
        const appId = typeof body?.appId === "string" ? body.appId.trim() : "";
        const type = body?.type === "driver" ? "driver" : "learner";
        const fee = typeof body?.fee === "number" && body.fee > 0 ? Math.round(body.fee) : 0;
        const email = typeof body?.email === "string" ? body.email.trim() : "";

        if (!appId || appId.length > 128) return json({ error: "Invalid application id" }, 400);
        if (!fee) return json({ error: "Invalid fee" }, 400);

        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) return json({ error: "Stripe not configured" }, 500);

        // Build absolute return URLs from this request's origin.
        const origin =
          request.headers.get("origin") ||
          (() => {
            const u = new URL(request.url);
            return `${u.protocol}//${u.host}`;
          })();

        const successUrl = `${origin}/apply/${encodeURIComponent(appId)}?step=payment&payment=success&session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${origin}/apply/${encodeURIComponent(appId)}?step=payment&payment=cancelled`;

        const itemName =
          type === "driver" ? "Driver's Licence Application Fee" : "Learner's Licence Application Fee";

        // Stripe API uses form-encoded bodies.
        const form = new URLSearchParams();
        form.set("mode", "payment");
        form.set("success_url", successUrl);
        form.set("cancel_url", cancelUrl);
        form.set("client_reference_id", appId);
        if (email) form.set("customer_email", email);
        form.set("line_items[0][quantity]", "1");
        form.set("line_items[0][price_data][currency]", "zar");
        form.set("line_items[0][price_data][unit_amount]", String(fee * 100));
        form.set("line_items[0][price_data][product_data][name]", itemName);
        form.set("line_items[0][price_data][product_data][description]", `eDLTS application ${appId}`);
        form.set("metadata[appId]", appId);
        form.set("metadata[type]", type);

        const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: form.toString(),
        });

        const payload = (await res.json().catch(() => ({}))) as {
          id?: string;
          url?: string;
          error?: { message?: string };
        };

        if (!res.ok || !payload.url) {
          return json(
            { error: payload.error?.message ?? `Stripe API ${res.status}` },
            502,
          );
        }

        return json({ id: payload.id, url: payload.url });
      },
    },
  },
});
