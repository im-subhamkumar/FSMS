// ---------------------------------------------------------------------------
// useReportData.js -- Data fetching hook for the Reports Dashboard module
//
// Fetches all seven report endpoints in parallel using Promise.all for
// optimal load time. Returns a unified data object keyed by report category.
//
// The hook supports date range filtering: when dateRange changes, all
// endpoints are re-fetched automatically via the useEffect dependency.
// A manual refetch() function is also exposed for the refresh button.
//
// Note: Report endpoints do not currently require JWT authentication.
// They are read-only aggregate views intended for admin consumption.
// ---------------------------------------------------------------------------

import { useState, useEffect, useCallback } from 'react';

// Base URL for all report API calls. Falls back to same-host port 3000.
const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;

export function useReportData(initialDateRange = { from: '', to: '' }) {
  const [dateRange, setDateRange] = useState(initialDateRange);

  // Unified data object -- each key corresponds to one report endpoint.
  // Initialised to null so components can distinguish "not yet loaded"
  // from "loaded but empty".
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

    // Build query string from date range for filtering
    const q = new URLSearchParams();
    if (dateRange.from) q.append('from', dateRange.from);
    if (dateRange.to) q.append('to', dateRange.to);
    const qs = q.toString() ? `?${q.toString()}` : '';

    try {
      // All seven endpoints are fetched in parallel for faster page load.
      // Each endpoint returns a self-contained data object.
      const endpoints = [
        'financial', 'students', 'flights',
        'instructors', 'courses', 'fleet', 'compliance'
      ];

      const responses = await Promise.all(
        endpoints.map(ep => fetch(`${API_BASE}/reports/${ep}${qs}`))
      );

      // Check for any failed responses before parsing JSON
      const failedIdx = responses.findIndex(r => !r.ok);
      if (failedIdx !== -1) {
        throw new Error(`Failed to fetch ${endpoints[failedIdx]} report (${responses[failedIdx].status})`);
      }

      // Parse all response bodies in parallel
      const [financial, students, flights, instructors, courses, fleet, compliance] =
        await Promise.all(responses.map(r => r.json()));

      setData({ financial, students, flights, instructors, courses, fleet, compliance });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);  // Re-fetch whenever the date range changes

  // Initial fetch on mount and when dateRange updates
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return { dateRange, setDateRange, data, loading, error, refetch: fetchAllData };
}
