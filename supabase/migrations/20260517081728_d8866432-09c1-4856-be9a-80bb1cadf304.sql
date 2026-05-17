ALTER TABLE public.transaction_audit_logs
  ADD COLUMN llm_cost_usd numeric(10, 6),
  ADD COLUMN amount_paid_usd numeric(10, 2);

COMMENT ON COLUMN public.transaction_audit_logs.llm_cost_usd IS 'Estimated USD cost of AI/LLM calls used to generate the narrative (computed from input/output tokens and model pricing).';
COMMENT ON COLUMN public.transaction_audit_logs.amount_paid_usd IS 'Actual amount paid by the customer for this report in USD (after promotion codes / discounts, from Stripe session amount_total).';