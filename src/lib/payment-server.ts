/**
 * Server-side payment utilities for Stripe and Demo Mode
 * 
 * These functions can be called from the frontend via server-side functions
 * or imported directly on the server in TanStack Start.
 */

/**
 * Create a Stripe checkout session (or demo session if DEMO_MODE is enabled)
 */
export async function createPaymentSession(input: {
  appId: string;
  type: "learner" | "driver";
  fee: number;
  email?: string;
  originUrl: string;
}): Promise<{
  id: string;
  url: string;
  demo?: boolean;
  error?: string;
}> {
  // Check if demo mode is enabled
  const DEMO_MODE = typeof process !== "undefined" && process.env?.DEMO_MODE === "true";

  if (DEMO_MODE) {
    // Demo mode: simulate successful payment
    const sessionId = `demo_${input.appId}_${Date.now()}`;
    const successUrl = `${input.originUrl}/apply/${encodeURIComponent(input.appId)}?step=payment&payment=success&session_id=${sessionId}`;
    
    return {
      id: sessionId,
      url: successUrl,
      demo: true,
    };
  }

  // Real Stripe mode
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return { error: "Stripe not configured", id: "", url: "" };
  }

  const itemName =
    input.type === "driver" 
      ? "Driver's Licence Application Fee" 
      : "Learner's Licence Application Fee";

  const successUrl = `${input.originUrl}/apply/${encodeURIComponent(input.appId)}?step=payment&payment=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${input.originUrl}/apply/${encodeURIComponent(input.appId)}?step=payment&payment=cancelled`;

  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("success_url", successUrl);
  form.set("cancel_url", cancelUrl);
  form.set("client_reference_id", input.appId);
  if (input.email) form.set("customer_email", input.email);
  form.set("line_items[0][quantity]", "1");
  form.set("line_items[0][price_data][currency]", "zar");
  form.set("line_items[0][price_data][unit_amount]", String(input.fee * 100));
  form.set("line_items[0][price_data][product_data][name]", itemName);
  form.set("line_items[0][price_data][product_data][description]", `eDLTS application ${input.appId}`);
  form.set("metadata[appId]", input.appId);
  form.set("metadata[type]", input.type);

  try {
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
      return {
        error: payload.error?.message ?? `Stripe API ${res.status}`,
        id: "",
        url: "",
      };
    }

    return { id: payload.id ?? "", url: payload.url, demo: false };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Payment creation failed",
      id: "",
      url: "",
    };
  }
}

/**
 * Verify a payment session (supports both real Stripe and demo sessions)
 */
export async function verifyPaymentSession(input: {
  appId: string;
  sessionId?: string;
}): Promise<{
  paid: boolean;
  sessionId?: string;
  transactionId?: string;
  amount?: number;
  currency?: string;
  paidAt?: number;
  demo?: boolean;
  error?: string;
}> {
  const DEMO_MODE = typeof process !== "undefined" && process.env?.DEMO_MODE === "true";

  // Check for demo sessions
  if (DEMO_MODE && input.sessionId?.startsWith("demo_")) {
    const sessionAppId = input.sessionId.split("_")[1];
    if (sessionAppId === input.appId) {
      return {
        paid: true,
        sessionId: input.sessionId,
        transactionId: `demo_txn_${input.appId}_${Date.now()}`,
        amount: 15000, // R150 in cents
        currency: "zar",
        paidAt: Date.now(),
        demo: true,
      };
    }
    return { paid: false, error: "Invalid demo session" };
  }

  // Real Stripe verification
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return { paid: false, error: "Stripe not configured" };
  }

  type StripeSession = {
    id: string;
    client_reference_id: string | null;
    payment_status: string;
    amount_total: number | null;
    currency: string | null;
    payment_intent: string | null;
    created: number;
  };

  // Direct lookup by session ID
  if (input.sessionId?.startsWith("cs_")) {
    try {
      const res = await fetch(
        `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(input.sessionId)}`,
        { headers: { Authorization: `Bearer ${key}` } },
      );

      if (!res.ok) {
        return { paid: false, error: `Stripe API ${res.status}` };
      }

      const session = (await res.json()) as StripeSession;
      if (
        session.client_reference_id === input.appId &&
        session.payment_status === "paid"
      ) {
        return {
          paid: true,
          sessionId: session.id,
          transactionId: session.payment_intent ?? session.id,
          amount: session.amount_total ?? 0,
          currency: session.currency ?? "zar",
          paidAt: session.created * 1000,
        };
      }
      return { paid: false };
    } catch (error) {
      return { paid: false, error: error instanceof Error ? error.message : "Verification failed" };
    }
  }

  // Fallback: scan recent sessions
  try {
    const res = await fetch(
      "https://api.stripe.com/v1/checkout/sessions?limit=100",
      { headers: { Authorization: `Bearer ${key}` } },
    );

    if (!res.ok) {
      return { paid: false, error: `Stripe API ${res.status}` };
    }

    const payload = (await res.json()) as { data: StripeSession[] };
    const match = payload.data.find(
      (session) =>
        session.client_reference_id === input.appId && session.payment_status === "paid",
    );

    if (!match) return { paid: false };

    return {
      paid: true,
      sessionId: match.id,
      transactionId: match.payment_intent ?? match.id,
      amount: match.amount_total ?? 0,
      currency: match.currency ?? "zar",
      paidAt: match.created * 1000,
    };
  } catch (error) {
    return { paid: false, error: error instanceof Error ? error.message : "Verification failed" };
  }
}
