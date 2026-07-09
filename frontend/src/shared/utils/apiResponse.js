/**
 * Normalizes API responses from useApi → apiService.
 * Handles both { status, data } and { success, data } shapes.
 */
export function getListFromResponse(apiResult) {
  if (!apiResult?.success || !apiResult.data) return [];

  const body = apiResult.data;
  const payload = body.data ?? body;

  return Array.isArray(payload) ? payload : [];
}

export function getObjectFromResponse(apiResult) {
  if (!apiResult?.success || !apiResult.data) return null;

  const body = apiResult.data;
  return body.data ?? body;
}
