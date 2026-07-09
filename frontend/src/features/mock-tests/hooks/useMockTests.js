import { useState, useCallback } from 'react';
import { apiService } from '@/shared/services/apiService';
import { useApi } from '@/shared/hooks/useApi';
import { getListFromResponse, getObjectFromResponse } from '@/shared/utils/apiResponse';

export function useMockTests() {
  const [mockTests, setMockTests] = useState([]);

  const getMockTestsApi = useApi(useCallback(() => apiService.get('/mock'), []));
  const getMockTestByIdApi = useApi(useCallback((id) => apiService.get(`/mock/${id}`), []));
  const createMockTestApi = useApi(useCallback((body) => apiService.post('/mock', body), []));
  const deleteMockTestApi = useApi(useCallback((id) => apiService.delete(`/mock/${id}`), []));

  const loadMockTests = useCallback(async () => {
    const result = await getMockTestsApi.execute();
    setMockTests(getListFromResponse(result));
  }, [getMockTestsApi]);

  const addMockTest = useCallback(async (testData) => {
    const result = await createMockTestApi.execute(testData);
    if (result.success) {
      await loadMockTests();
      return { success: true };
    }
    return { success: false, error: result.error };
  }, [createMockTestApi, loadMockTests]);

  const getFullTest = useCallback(async (id) => {
    const result = await getMockTestByIdApi.execute(id);
    return getObjectFromResponse(result);
  }, [getMockTestByIdApi]);

  const removeMockTest = useCallback(async (id) => {
    const result = await deleteMockTestApi.execute(id);
    if (result.success) {
      await loadMockTests();
      return { success: true };
    }
    return { success: false, error: result.error };
  }, [deleteMockTestApi, loadMockTests]);

  return {
    mockTests,
    loading: getMockTestsApi.loading || createMockTestApi.loading || getMockTestByIdApi.loading || deleteMockTestApi.loading,
    error: getMockTestsApi.error || createMockTestApi.error || getMockTestByIdApi.error || deleteMockTestApi.error,
    loadMockTests,
    addMockTest,
    getFullTest,
    removeMockTest
  };
}
