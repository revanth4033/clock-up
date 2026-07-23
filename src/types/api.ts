/** Standard API envelope used by every /api/v1 route handler (ASD). */
export type ApiErrorBody = {
  code: string;
  details?: unknown;
};

export type ApiResponse<T = null> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; error: ApiErrorBody };
