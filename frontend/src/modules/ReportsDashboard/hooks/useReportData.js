import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;

export function useReportData(initialDateRange = { from: '', to: '' }) {
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [data, setData] = useState({
    financial: null,
    students: null,
    flights: null,
    instructors: null,
    courses: null,
    fleet: null,
    compliance: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const q = new URLSearchParams();
    if (dateRange.from) q.append('from', dateRange.from);
    if (dateRange.to) q.append('to', dateRange.to);
    const qs = q.toString() ? `?${q.toString()}` : '';

    try {
      const endpoints = [
        'financial', 'students', 'flights',
        'instructors', 'courses', 'fleet', 'compliance'
      ];

      const responses = await Promise.all(
        endpoints.map(ep => fetch(`${API_BASE}/reports/${ep}${qs}`))
      );

      // Check for any failed responses
      const failedIdx = responses.findIndex(r => !r.ok);
      if (failedIdx !== -1) {
        throw new Error(`Failed to fetch ${endpoints[failedIdx]} report (${responses[failedIdx].status})`);
      }

      const [financial, students, flights, instructors, courses, fleet, compliance] =
        await Promise.all(responses.map(r => r.json()));

      setData({ financial, students, flights, instructors, courses, fleet, compliance });
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
