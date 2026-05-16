import { useCallback, useMemo, useState } from "react";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  priceId: string;
  assessmentId: string;
  customerEmail?: string;
  /**
   * URL Stripe redirects the buyer to after the embedded checkout completes.
   * Must be on an origin allowlisted in the `create-checkout` edge function.
   * Stripe substitutes `{CHECKOUT_SESSION_ID}` server-side.
   */
  returnUrl: string;
}

/**
 * Renders the Stripe Embedded Checkout iframe inline. The clientSecret is
 * minted by the `create-checkout` edge function, which:
 *   • validates the returnUrl against an allowlist (no open redirect),
 *   • binds the assessmentId to the session via `client_reference_id` and
 *     `metadata`, so `mint-report-token` can verify the payment matches
 *     the assessment without trusting client-supplied input.
 */
export function StripeEmbeddedCheckout({
  priceId,
  assessmentId,
  customerEmail,
  returnUrl,
}: Props) {
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    setCheckoutError(null);
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: {
        priceId,
        assessmentId,
        customerEmail: customerEmail?.trim() || undefined,
        returnUrl,
        environment: getStripeEnvironment(),
      },
    });
    if (error || !data?.clientSecret) {
      const message = "We couldn't load checkout. Please check your email address and try again.";
      setCheckoutError(message);
      throw new Error(error?.message || message);
    }
    return data.clientSecret as string;
  }, [priceId, assessmentId, customerEmail, returnUrl]);

  const options = useMemo(() => ({ fetchClientSecret }), [fetchClientSecret]);

  return (
    <div id="checkout">
      {checkoutError && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {checkoutError}
        </div>
      )}
      <EmbeddedCheckoutProvider stripe={getStripe()} options={options}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}