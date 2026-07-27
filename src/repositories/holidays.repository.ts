import type { SupabaseClient } from "@supabase/supabase-js";

/** Read-only access to the company / office holiday calendar (`holidays`). */
export const holidayRepository = {
  /**
   * The holiday name if `dateStr` is a holiday for this office — either a
   * company-wide holiday (`office_location_id is null`) or one specific to the
   * office — else null. An office-specific entry wins over a company-wide one.
   */
  async findForDate(
    supabase: SupabaseClient,
    officeLocationId: string,
    dateStr: string,
  ): Promise<string | null> {
    const { data, error } = await supabase
      .from("holidays")
      .select("name, office_location_id")
      .eq("holiday_date", dateStr)
      .or(
        `office_location_id.is.null,office_location_id.eq.${officeLocationId}`,
      )
      // Non-null (office-specific) sorts before null (company-wide) → wins.
      .order("office_location_id", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? (data.name as string) : null;
  },
};
