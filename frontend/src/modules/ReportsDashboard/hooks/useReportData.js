import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export function useReportData(initialDateRange = { from: '', to: '' }) {
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [data, setData] = useState({
    financial: null,
    students: null,
    flights: null,
    instructors: null,
    courses: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const headers = {
      'Content-Type': 'application/json'
    };

    const q = new URLSearchParams();
    if (dateRange.from) q.append('from', dateRange.from);
    if (dateRange.to) q.append('to', dateRange.to);
    const qs = q.toString() ? `?${q.toString()}` : '';

    try {
      const [finRes, stuRes, fliRes, insRes, couRes] = await Promise.all([
        fetch(`${API_BASE}/reports/financial${qs}`, { headers }),
        fetch(`${API_BASE}/reports/students${qs}`, { headers }),
        fetch(`${API_BASE}/reports/flights${qs}`, { headers }),
        fetch(`${API_BASE}/reports/instructors${qs}`, { headers }),
        fetch(`${API_BASE}/reports/courses${qs}`, { headers })
      ]);

      if (!finRes.ok || !stuRes.ok || !fliRes.ok || !insRes.ok || !couRes.ok) {
        throw new Error('Failed to fetch report data. API returned an error.');
      }

      const [financial, students, flights, instructors, courses] = await Promise.all([
        finRes.json(),
        stuRes.json(),
        fliRes.json(),
        insRes.json(),
        couRes.json()
      ]);

      setData({ financial, students, flights, instructors, courses });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return { dateRange, setDateRange, data, loading, error, refetch: fetchAllData };
}
