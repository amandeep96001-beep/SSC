/**
 * Normalizes API responses from useApi → apiService.
 * Handles both { status, data } and { success, data } shapes.
 */

interface ApiEnvelope {
  success?: boolean;
  data?: unknown;
}

function unwrapPayload(body: unknown): unknown {
  if (body && typeof body === 'object' && 'data' in body) {
    return (body as { data?: unknown }).data ?? body;
  }
  return body;
}

export function getListFromResponse<T = unknown>(apiResult: ApiEnvelope | null | undefined): T[] {
  if (!apiResult?.success || apiResult.data == null) return [];

  const payload = unwrapPayload(apiResult.data);
  return Array.isArray(payload) ? (payload as T[]) : [];
}

export function getObjectFromResponse<T = unknown>(
  apiResult: ApiEnvelope | null | undefined
): T | null {
  if (!apiResult?.success || apiResult.data == null) return null;

  return unwrapPayload(apiResult.data) as T;
}
