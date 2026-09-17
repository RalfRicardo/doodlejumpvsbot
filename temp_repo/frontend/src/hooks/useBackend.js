import { useEffect, useState } from 'react';
import { getJson } from '../services/api.js';

export function useBackend() {
  const [result, setResult] = useState({ loading: true, error: '', config: null });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setResult({ loading: true, error: '', config: null });
    getJson('/api/config', { signal: controller.signal }).then(config => {
      if (!controller.signal.aborted) setResult({ loading: false, error: '', config });
    }).catch(error => {
      if (!controller.signal.aborted) setResult({ loading: false, error: error.message, config: null });
    });
    return () => controller.abort();
  }, [attempt]);
  return { ...result, retry: () => setAttempt(previous => previous + 1) };
}
