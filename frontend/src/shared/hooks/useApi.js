import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook to run asynchronous API requests cleanly without cluttering components.
 */
export function useApi(apiFunc) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiFuncRef = useRef(apiFunc);
  apiFuncRef.current = apiFunc;

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFuncRef.current(...args);
        setData(result);
        return { success: true, data: result };
      } catch (err) {
        setError(err.message || 'Something went wrong');
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    data,
    loading,
    error,
    execute,
    clearError
  };
}
