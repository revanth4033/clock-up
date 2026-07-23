import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserProfile } from "@/types/domain";

type Row = {
  id: string;
  employee_id: string;
  full_name: string;
  office_email: string;
  designation: string;
  office_location_id: string;
  avatar_url: string | null;
};

const COLUMNS =
  "id, employee_id, full_name, office_email, designation, office_location_id, avatar_url";

const toDomain = (r: Row): UserProfile => ({
  id: r.id,
  employeeId: r.employee_id,
  fullName: r.full_name,
  officeEmail: r.office_email,
  designation: r.designation,
  officeLocationId: r.office_location_id,
  avatarUrl: r.avatar_url,
});

export const usersRepository = {
  /** Reads the profile for an authenticated user (profile rows are created by
   * the `on_auth_user_created` trigger, never by the app). */
  async findByAuthId(
    supabase: SupabaseClient,
    passwordAuthId: string,
  ): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from("users")
      .select(COLUMNS)
      .eq("password_auth_id", passwordAuthId)
      .maybeSingle();
    if (error) throw error;
    return data ? toDomain(data as Row) : null;
  },
};
