/** Result type returned by service functions and translated to HTTP by routes. */
export type ServiceResult<T = null> =
  | { ok: true; message: string; data: T }
  | { ok: false; code: string; message: string };
