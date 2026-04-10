import React, { useState, useEffect } from 'react';
import './ExpandedTableView.css';

export default function ExpandedTableView({ type }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const endpoint = type === 'fleet' ? '/maintenance/aircraft' : '/maintenance/assigned-repairs';
        const res = await fetch(`${API_URL}${endpoint}`);
        const result = await res.json();
        setData(Array.isArray(result) ? result : []);
      } catch (err) {
        console.error('Failed to fetch table data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [type]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading records...</div>;

  return (
    <div className="expanded-table-container">
      <table className="expanded-table">
        <thead>
          <tr>
            {type === 'fleet' ? (
              <>
                <th>Tail No.</th>
                <th>Type</th>
                <th>Status</th>
                <th>Base</th>
                <th>Total Hours</th>
              </>
            ) : (
              <>
                <th>Tail No.</th>
                <th>Issue Details</th>
                <th>Currently Assigned AME</th>
                <th>Report Date</th>
                <th>Status</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No records found.</td></tr>
          ) : data.map((row, i) => (
            <tr key={i}>
              {type === 'fleet' ? (
                <>
                  <td style={{ fontWeight: 600 }}>{row.tailNumber}</td>
                  <td>{row.type}</td>
                  <td><span className={`badge badge-${row.status === 'AIRWORTHY' ? 'green' : row.status === 'IN_MAINTENANCE' ? 'blue' : 'red'}`}>{row.status}</span></td>
                  <td>{row.homeBase}</td>
                  <td>{row.hoursTotal}</td>
                </>
              ) : (
                <>
                  <td style={{ fontWeight: 600 }}>{row.id}</td>
                  <td>{row.issue}</td>
                  <td>{row.ame}</td>
                  <td>{row.due}</td>
                  <td><span className={`badge badge-${row.statusColor}`}>{row.status}</span></td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
