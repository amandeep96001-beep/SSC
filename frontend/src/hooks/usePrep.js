import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { useApi } from './useApi';

export function usePrep() {
  const [notes, setNotes] = useState([]);
  const [connection, setConnection] = useState({ isOnline: false, dbStatus: 'Offline' });

  // API wrappers
  const getNotesApi = useApi(useCallback(() => apiService.get('/prep/notes'), []));
  const createNoteApi = useApi(useCallback((body) => apiService.post('/prep/notes', body), []));
  const deleteNoteApi = useApi(useCallback((id) => apiService.delete(`/prep/notes/${id}`), []));
  const getStatusApi = useApi(useCallback(() => apiService.get('/prep/status'), []));

  // Load all notes
  const fetchNotes = useCallback(async () => {
    const result = await getNotesApi.execute();
    if (result.success && result.data.data) {
      setNotes(result.data.data);
    }
  }, [getNotesApi]);

  // Load status
  const fetchStatus = useCallback(async () => {
    const result = await getStatusApi.execute();
    if (result.success) {
      setConnection({
        isOnline: true,
        dbStatus: result.data.database
      });
    } else {
      setConnection({
        isOnline: false,
        dbStatus: 'Offline'
      });
    }
  }, [getStatusApi]);

  // Add Note
  const addNote = useCallback(async (noteData) => {
    const result = await createNoteApi.execute(noteData);
    if (result.success && result.data.data) {
      setNotes((prev) => [...prev, result.data.data]);
      return { success: true };
    }
    return { success: false, error: result.error };
  }, [createNoteApi]);

  // Delete Note
  const removeNote = useCallback(async (id) => {
    const result = await deleteNoteApi.execute(id);
    if (result.success) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      return { success: true };
    }
    return { success: false, error: result.error };
  }, [deleteNoteApi]);

  // Setup initial hooks & polling for network connection check
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStatus();
     
    fetchNotes();

     
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    notes,
    connection,
    loading: getNotesApi.loading || createNoteApi.loading,
    error: getNotesApi.error || createNoteApi.error || deleteNoteApi.error,
    fetchNotes,
    addNote,
    removeNote,
    fetchStatus
  };
}
