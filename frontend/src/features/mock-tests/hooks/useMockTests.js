import { useState, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { useApi } from './useApi';

export function useMockTests() {
  const [mockTests, setMockTests] = useState([]);

  // API wrappers
  const getMockTestsApi = useApi(useCallback(() => apiService.get('/mock'), []));
  const getMockTestByIdApi = useApi(useCallback((id) => apiService.get(`/mock/${id}`), []));
  const createMockTestApi = useApi(useCallback((body) => apiService.post('/mock', body), []));
  const deleteMockTestApi = useApi(useCallback((id) => apiService.delete(`/mock/${id}`), []));

  const getMockTestsExecute = getMockTestsApi.execute;

  const loadMockTests = useCallback(async () => {
    const result = await getMockTestsExecute();
    if (result.success && result.data.data) {
      setMockTests(result.data.data);
    }
  }, [getMockTestsExecute]);

  const createMockTestExecute = createMockTestApi.execute;

  const addMockTest = useCallback(async (testData) => {
    const result = await createMockTestExecute(testData);
    if (result.success) {
      await loadMockTests(); // Refresh the list
      return { success: true };
    }
    return { success: false, error: result.error };
  }, [createMockTestExecute, loadMockTests]);

  const getMockTestByIdExecute = getMockTestByIdApi.execute;

  const getFullTest = useCallback(async (id) => {
    const result = await getMockTestByIdExecute(id);
    if (result.success && result.data.data) {
      return result.data.data;
    }
    return null;
  }, [getMockTestByIdExecute]);

  const deleteMockTestExecute = deleteMockTestApi.execute;

  const removeMockTest = useCallback(async (id) => {
    const result = await deleteMockTestExecute(id);
    if (result.success) {
      await loadMockTests();
      return { success: true };
    }
    return { success: false, error: result.error };
  }, [deleteMockTestExecute, loadMockTests]);

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
