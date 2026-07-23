import "server-only";

import { createClient } from "@/lib/supabase/server";
import { officeLocationsRepository } from "@/repositories/office-locations.repository";
import type { OfficeLocation } from "@/types/domain";

/** Lists office locations (publicly readable — needed by the registration form). */
export async function getOfficeLocations(): Promise<OfficeLocation[]> {
  const supabase = await createClient();
  return officeLocationsRepository.list(supabase);
}
