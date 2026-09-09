import { useState, useCallback, useRef, useMemo } from 'react';
import { errorMessage } from '@/types/app';

export type ApiExecuteResult<TResult> =
  | { success: true; data: TResult }
  | { success: false; error: string };

/**
 * Custom hook to run asynchronous API requests cleanly without cluttering components.
 */
export function useApi<TArgs extends unknown[], TResult>(
  apiFunc: (...args: TArgs) => Promise<TResult>
) {
  const [data, setData] = useState<TResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiFuncRef = useRef(apiFunc);
  apiFuncRef.current = apiFunc;

  const execute = useCallback(
    async (...args: TArgs): Promise<ApiExecuteResult<TResult>> => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFuncRef.current(...args);
        setData(result);
        return { success: true, data: result };
      } catch (err) {
        const message = errorMessage(err);
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => setError(null), []);

  return useMemo(
    () => ({ data, loading, error, execute, clearError }),
    [data, loading, error, execute, clearError]
  );
}
