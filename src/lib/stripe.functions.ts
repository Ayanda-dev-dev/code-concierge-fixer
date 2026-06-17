// Stripe payment verification server function.
//
// Uses the test secret key (stored as STRIPE_SECRET_KEY in Lovable secrets)
// to look up Checkout Sessions and confirm payment status. We key the lookup
// by `client_reference_id`, which we set to the application id when opening
// the Stripe Payment Link.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type StripeSession = {
  id: string;
  client_reference_id: string | null;
  payment_status: string;
  amount_total: number | null;
  currency: string | null;
  payment_intent: string | null;
  created: number;
};

export const verifyStripePayment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ appId: z.string().min(1).max(128) }).parse(d),
  )
  .handler(async ({ data }) => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      return { paid: false as const, error: "Stripe not configured" };
    }

    // Stripe doesn't support filtering by client_reference_id on /list, so we
    // pull recent sessions and filter client-side. For a demo/test account
    // the most recent ~100 sessions is more than enough.
    const res = await fetch(
      "https://api.stripe.com/v1/checkout/sessions?limit=100",
      { headers: { Authorization: `Bearer ${key}` } },
    );
    if (!res.ok) {
      const text = await res.text();
      return { paid: false as const, error: `Stripe API ${res.status}: ${text.slice(0, 200)}` };
    }
    const json = (await res.json()) as { data: StripeSession[] };
    const match = json.data.find(
      (s) => s.client_reference_id === data.appId && s.payment_status === "paid",
    );
    if (!match) return { paid: false as const };

    return {
      paid: true as const,
      sessionId: match.id,
      transactionId: match.payment_intent ?? match.id,
      amount: match.amount_total ?? 0,
      currency: match.currency ?? "usd",
      paidAt: match.created * 1000,
    };
  });
