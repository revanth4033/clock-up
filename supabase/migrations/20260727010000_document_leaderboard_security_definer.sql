-- ---------------------------------------------------------------------------
-- Documentation-only migration. Adds a SQL comment recording why
-- public.v_leaderboard intentionally uses SECURITY DEFINER. It does NOT change
-- the view definition, RLS policies, grants, or any application behaviour —
-- `comment on view` only attaches metadata.
--
-- WHY v_leaderboard IS (INTENTIONALLY) A SECURITY DEFINER VIEW
--   The leaderboard must rank across ALL users (BRD §20), but every base table
--   it reads (users, attendance, points_ledger) enforces strict own-row RLS
--   (user_id = current_app_user_id()). A view defaults to definer/owner
--   semantics, which bypasses that RLS, so it can aggregate every user's totals
--   and expose ONLY public leaderboard columns:
--     user_id, full_name, avatar_url, total_points, total_completed_days,
--     total_worked_minutes, last_completion_at, rank.
--   No email, employee_id, office, or per-day rows are exposed (a view can only
--   return its declared columns), and SELECT is granted to `authenticated` only.
--
--   Converting the view to SECURITY INVOKER would BREAK the leaderboard: under
--   own-row RLS it would return only the caller's own row. The equivalent
--   cross-user RPC public.get_leaderboard(text) is SECURITY DEFINER for the same
--   reason (and additionally hardened with `set search_path = ''`).
--
--   The Supabase Security Advisor "Security Definer View" warning for
--   public.v_leaderboard is therefore an ACCEPTED, intentional exception — not a
--   defect. See docs/adr/ADR-005-security-definer-strategy.md.
-- ---------------------------------------------------------------------------

comment on view public.v_leaderboard is
  'Intentional SECURITY DEFINER view. Ranks across all users while the base '
  'tables enforce own-row RLS, exposing only public leaderboard columns (name, '
  'avatar, points, worked minutes, completed days, rank); SELECT granted to '
  'authenticated only. SECURITY INVOKER would break it (returns only the '
  'caller''s own row). The Supabase "Security Definer View" advisory is an '
  'accepted, intentional exception — see ADR-005.';
