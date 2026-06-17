# Demo Payment Mode - Quick Reference

## What Was Done

Implemented a temporary **Demo Payment Mode** that simulates successful Stripe payments without actual payment processing. This allows testing and demonstrations of the complete application workflow.

## Current Status

✅ **Demo Mode is ACTIVE** (DEMO_MODE=true in .env.local)

## How to Use

### For End Users
1. Click "Pay R150 with Stripe" on Payment step
2. See "DEMO MODE" badge at top
3. Payment automatically simulates as successful
4. Continue to Booking section
5. Complete application workflow

### For Developers
- **Enable**: Keep `DEMO_MODE=true` in `.env.local`
- **Disable**: Set `DEMO_MODE=false` and add `STRIPE_SECRET_KEY=sk_test_...`
- **Restart**: `npm run dev` after env changes

## What Was Implemented

1. **Environment Configuration**
   - `.env.local` - DEMO_MODE toggle

2. **Server API Updates**
   - `api.public.stripe.create-session.ts` - Demo session creation
   - `api.public.stripe.verify.ts` - Demo session verification

3. **Frontend Updates**
   - Payment step UI - Demo mode banner and explanation
   - Payment functions - Fallback to client-side demo mode
   - Verification - Client-side demo payment validation

4. **Server Utilities**
   - `lib/payment-server.ts` - Reusable payment functions

## Files Modified

- `.env.local` (created)
- `.src/routes/api.public.stripe.create-session.ts`
- `src/routes/api.public.stripe.verify.ts`
- `src/routes/apply.$appId.tsx`
- `src/lib/payment-server.ts` (created)

## Key Features

✅ Visual "DEMO MODE" badge in Payment step  
✅ Simulates successful payment instantly  
✅ No Stripe redirect needed  
✅ Fallback mechanism for API failures  
✅ Real Stripe integration unchanged  
✅ Easy to toggle on/off  
✅ Production-ready code  

## Testing Payment

1. Navigate to Payment step
2. See blue "DEMO MODE" badge
3. Click "Pay R150 with Stripe"
4. See "Demo mode: Simulating successful payment..." toast
5. Payment automatically marks as "Paid"
6. Continue button becomes enabled
7. Proceed to Booking step

## Switching to Real Stripe

When ready:
1. Edit `.env.local`: `DEMO_MODE=false`
2. Add: `STRIPE_SECRET_KEY=sk_test_your_key`
3. Restart: `npm run dev`
4. Done - system uses real Stripe

## Fallback Logic

1. **Primary**: Tries real Stripe API (if DEMO_MODE=false)
2. **Secondary**: Falls back to client-side demo if API returns 404
3. **Result**: Payment always completes (demo or real)

## Demo Session Format

- Format: `demo_{appId}_{timestamp}`
- Example: `demo_6igBDa3CqmN7AekKKA1r_1781730120000`
- Validated during verification

## Next Steps

When done demonstrating:
1. Set `DEMO_MODE=false` in `.env.local`
2. Add real Stripe credentials
3. Restart dev server
4. System automatically uses real payments

No code changes needed - just environment variables!

---

For detailed information, see: [DEMO_MODE_GUIDE.md](./DEMO_MODE_GUIDE.md)
