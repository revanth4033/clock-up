-- ClockUp — Security patch follow-up: also revoke EXECUTE from `anon`.
--
-- Supabase's default privileges grant EXECUTE on new public functions to anon,
-- authenticated AND service_role individually, so revoking from `authenticated`
-- and `public` (migration 20260724070000) left `anon`'s explicit grant intact.
-- An anon caller cannot actually mint/burn credits (no session ⇒
-- current_app_user_id() is null ⇒ AUTH_REQUIRED before any ledger write), so the
-- authenticated self-mint exploit was already closed. This revoke completes the
-- intent that ONLY the internal earning/settlement path (direct INSERT inside the
-- SECURITY DEFINER functions award_time_credits / settle_attendance_day) can
-- invoke these RPCs. `service_role` (the privileged admin/HR path) intentionally
-- retains EXECUTE. Forward-only; historical migrations are not edited.

revoke execute on function public.add_time_credit(integer, public.credit_entry_type, text, uuid)
  from anon;

revoke execute on function public.consume_time_credit(integer, text)
  from anon;
