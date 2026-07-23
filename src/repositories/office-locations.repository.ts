import type { SupabaseClient } from "@supabase/supabase-js";
import type { OfficeLocation } from "@/types/domain";

type Row = {
  id: string;
  office_name: string;
  latitude: number;
  longitude: number;
  allowed_radius: number;
};

const COLUMNS = "id, office_name, latitude, longitude, allowed_radius";

const toDomain = (r: Row): OfficeLocation => ({
  id: r.id,
  officeName: r.office_name,
  latitude: Number(r.latitude),
  longitude: Number(r.longitude),
  allowedRadius: r.allowed_radius,
});

export const officeLocationsRepository = {
  async list(supabase: SupabaseClient): Promise<OfficeLocation[]> {
    const { data, error } = await supabase
      .from("office_locations")
      .select(COLUMNS)
      .order("office_name");
    if (error) throw error;
    return (data as Row[]).map(toDomain);
  },
};
