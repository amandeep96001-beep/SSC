import { useState, useCallback } from 'react';
import { apiService } from '@/shared/services/apiService';
import { useApi } from '@/shared/hooks/useApi';
import { getListFromResponse, getObjectFromResponse } from '@/shared/utils/apiResponse';

export function useMockTests() {
  const [mockTests, setMockTests] = useState([]);

  const { execute: fetchMockTests, loading: listLoading, error: listError } = useApi(
    useCallback((examId) => apiService.get(`/mock?examId=${encodeURIComponent(examId || 'ssc')}`), [])
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

  const loadMockTests = useCallback(async (examId = 'ssc') => {
    const result = await fetchMockTests(examId);
    setMockTests(getListFromResponse(result));
  }, [fetchMockTests]);

  const addMockTest = useCallback(async (testData) => {
    const result = await createMock(testData);
    if (result.success) {
      await loadMockTests(testData.examId || 'ssc');
      return { success: true };
    }
    return { success: false, error: result.error };
  }, [createMock, loadMockTests]);

  const getFullTest = useCallback(async (id) => {
    const result = await fetchMockById(id);
    return getObjectFromResponse(result);
  }, [fetchMockById]);

  const removeMockTest = useCallback(async (id, examId = 'ssc') => {
    const result = await deleteMock(id);
    if (result.success) {
      await loadMockTests(examId);
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
