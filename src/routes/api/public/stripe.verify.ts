// Server-side Stripe Checkout verification.
//
// The browser calls this route after returning from Stripe Checkout. Keeping
// the Stripe secret lookup behind a route also keeps TanStack Start server
// helpers out of the browser bundle.

import { createFileRoute } from "@tanstack/react-router";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

type StripeSession = {
  id: string;
  client_reference_id: string | null;
  payment_status: string;
  amount_total: number | null;
  currency: string | null;
  payment_intent: string | null;
  created: number;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

export const Route = createFileRoute("/api/public/stripe/verify")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, { status: 204, headers: CORS_HEADERS }),

      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as { appId?: unknown } | null;
        const appId = typeof body?.appId === "string" ? body.appId.trim() : "";
        if (!appId || appId.length > 128) {
          return json({ paid: false, error: "Invalid application id" }, 400);
        }

        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) {
          return json({ paid: false, error: "Stripe not configured" });
        }

        const res = await fetch(
          "https://api.stripe.com/v1/checkout/sessions?limit=100",
          { headers: { Authorization: `Bearer ${key}` } },
        );
        if (!res.ok) {
          const text = await res.text();
          return json(
            { paid: false, error: `Stripe API ${res.status}: ${text.slice(0, 200)}` },
            502,
          );
        }

        const payload = (await res.json()) as { data: StripeSession[] };
        const match = payload.data.find(
          (session) =>
            session.client_reference_id === appId && session.payment_status === "paid",
        );
        if (!match) return json({ paid: false });

        return json({
          paid: true,
          sessionId: match.id,
          transactionId: match.payment_intent ?? match.id,
          amount: match.amount_total ?? 0,
          currency: match.currency ?? "usd",
          paidAt: match.created * 1000,
        });
      },
    },
  },
});
