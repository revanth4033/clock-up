-- ClockUp — Security patch: RC1 blocker remediation for v1.1.0.
--
-- The Phase-2 helper RPCs add_time_credit() and consume_time_credit() were left
-- callable by `authenticated`. PostgREST exposes any EXECUTE-granted public
-- function at POST /rest/v1/rpc/<fn>, and both are SECURITY DEFINER functions
-- that derive the caller's OWN identity from current_app_user_id(). As a result
-- any signed-in user could call them directly with the browser-safe publishable
-- key — self-minting (add_time_credit) or self-burning (consume_time_credit)
-- Time Credits, bypassing the app entirely. With redemption enabled in v1.1.0,
-- self-minted credits convert into reduced required hours and unearned points.
--
-- FIX: revoke direct EXECUTE from `authenticated` AND `public`. (Postgres grants
-- EXECUTE to PUBLIC by default at function creation, so both grantees must be
-- revoked to fully close the endpoint.)
--
-- This changes NO business rule, schema, or behavior of the legitimate paths:
--   • Earning writes the ledger inside award_time_credits() via a direct INSERT
--     (20260724010000_time_credit_earning.sql:44) — it does NOT call
--     add_time_credit.
--   • Settlement consumes inside settle_attendance_day() via a direct INSERT
--     (20260724050000_settlement_integration.sql:82) — it does NOT call
--     consume_time_credit.
-- Both are SECURITY DEFINER (owner-executed) and never route through these two
-- helper RPCs, so revoking the helpers' grants leaves earning and settlement
-- untouched. Forward-only; historical migrations are not edited.

revoke execute on function public.add_time_credit(integer, public.credit_entry_type, text, uuid)
  from authenticated, public;

revoke execute on function public.consume_time_credit(integer, text)
  from authenticated, public;
