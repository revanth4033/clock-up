import { logoutUser } from "@/services/auth.service";
import { apiSuccess } from "@/lib/api/response";

export async function POST() {
  const result = await logoutUser();
  return apiSuccess(null, result.message);
}
