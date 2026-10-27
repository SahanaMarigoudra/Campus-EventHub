import { useState, useEffect, useCallback } from 'react';
import { fetchEvents } from '../services/api';

export function useEvents(initialParams = {}) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initialParams);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEvents(params);
      setEvents(data.events || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const updateEvent = (updatedEvent) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === updatedEvent.id ? { ...e, ...updatedEvent } : e))
    );
  };

  return { events, loading, error, setParams, refresh: loadEvents, updateEvent };
}
