import { getOfficeLocations } from "@/services/office.service";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET() {
  try {
    const offices = await getOfficeLocations();
    return apiSuccess(offices, "Office locations retrieved.");
  } catch {
    return apiError(
      "Couldn't load office locations. Please try again.",
      "SERVER_ERROR",
    );
  }
}
