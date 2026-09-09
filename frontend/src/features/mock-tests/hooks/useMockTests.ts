import { useState, useCallback } from 'react';
import { apiService } from '@/shared/services/apiService';
import type { ApiJson } from '@/shared/services/apiService';
import { useApi } from '@/shared/hooks/useApi';
import { getListFromResponse, getObjectFromResponse } from '@/shared/utils/apiResponse';
import type { MockTestItem } from '@/types/app';

export function useMockTests() {
  const [mockTests, setMockTests] = useState<MockTestItem[]>([]);

  const { execute: fetchMockTests, loading: listLoading, error: listError } = useApi<[string], ApiJson>(
    useCallback((examId: string) => apiService.get(`/mock?examId=${encodeURIComponent(examId || 'ssc')}`), [])
  );
  const { execute: fetchMockById, loading: byIdLoading, error: byIdError } = useApi<[string], ApiJson>(
    useCallback((id: string) => apiService.get(`/mock/${id}`), [])
  );
  const { execute: createMock, loading: createLoading, error: createError } = useApi<[unknown], ApiJson>(
    useCallback((body: unknown) => apiService.post('/mock', body), [])
  );
  const { execute: deleteMock, loading: deleteLoading, error: deleteError } = useApi<[string], ApiJson>(
    useCallback((id: string) => apiService.delete(`/mock/${id}`), [])
  );

  const loadMockTests = useCallback(async (examId = 'ssc') => {
    const result = await fetchMockTests(examId);
    setMockTests(getListFromResponse<MockTestItem>(result));
  }, [fetchMockTests]);

  const addMockTest = useCallback(async (testData: MockTestItem & Record<string, unknown>) => {
    const result = await createMock(testData);
    if (result.success) {
      await loadMockTests(testData.examId || 'ssc');
      return { success: true };
    }
    return { success: false, error: result.error };
  }, [createMock, loadMockTests]);

  const getFullTest = useCallback(async (id: string) => {
    const result = await fetchMockById(id);
    return getObjectFromResponse<MockTestItem>(result);
  }, [fetchMockById]);

  const removeMockTest = useCallback(async (id: string, examId = 'ssc') => {
    const result = await deleteMock(id);
    if (result.success) {
      await loadMockTests(examId);
      return { success: true };
    }
    return { success: false, error: result.error };
  }, [deleteMock, loadMockTests]);

  return {
    mockTests,
    loading: listLoading || createLoading || deleteLoading,
    listLoading,
    createLoading,
    error: listError || createError || byIdError || deleteError,
    loadMockTests,
    addMockTest,
    getFullTest,
    removeMockTest
  };
}

export type UseMockTestsReturn = ReturnType<typeof useMockTests>;
