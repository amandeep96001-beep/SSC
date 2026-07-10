import { useState, useCallback } from 'react';
import { apiService } from '@/shared/services/apiService';
import { useApi } from '@/shared/hooks/useApi';
import { getListFromResponse, getObjectFromResponse } from '@/shared/utils/apiResponse';

export function useMockTests() {
  const [mockTests, setMockTests] = useState([]);

  const { execute: fetchMockTests, loading: listLoading, error: listError } = useApi(
    useCallback(() => apiService.get('/mock'), [])
  );
  const { execute: fetchMockById, loading: byIdLoading, error: byIdError } = useApi(
    useCallback((id) => apiService.get(`/mock/${id}`), [])
  );
  const { execute: createMock, loading: createLoading, error: createError } = useApi(
    useCallback((body) => apiService.post('/mock', body), [])
  );
  const { execute: deleteMock, loading: deleteLoading, error: deleteError } = useApi(
    useCallback((id) => apiService.delete(`/mock/${id}`), [])
  );

  // Depend only on stable execute fns — whole useApi objects change every render
  // and would retrigger MockWorkspace's load effect in an infinite loop.
  const loadMockTests = useCallback(async () => {
    const result = await fetchMockTests();
    setMockTests(getListFromResponse(result));
  }, [fetchMockTests]);

  const addMockTest = useCallback(async (testData) => {
    const result = await createMock(testData);
    if (result.success) {
      await loadMockTests();
      return { success: true };
    }
    return { success: false, error: result.error };
  }, [createMock, loadMockTests]);

  const getFullTest = useCallback(async (id) => {
    const result = await fetchMockById(id);
    return getObjectFromResponse(result);
  }, [fetchMockById]);

  const removeMockTest = useCallback(async (id) => {
    const result = await deleteMock(id);
    if (result.success) {
      await loadMockTests();
      return { success: true };
    }
    return { success: false, error: result.error };
  }, [deleteMock, loadMockTests]);

  return {
    mockTests,
    loading: listLoading || createLoading || byIdLoading || deleteLoading,
    error: listError || createError || byIdError || deleteError,
    loadMockTests,
    addMockTest,
    getFullTest,
    removeMockTest
  };
}
