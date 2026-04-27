import React, { useState, useEffect } from 'react';
import './ExpandedTableView.css';

export default function ExpandedTableView({ type }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;
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
                <th>Name</th>
                <th>Model</th>
                <th>Status</th>
                <th>Type</th>
                <th>Last Maintenance</th>
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
                   <td style={{ fontWeight: 600 }}>{row.name}</td>
                  <td>{row.model}</td>
                  <td><span className={`badge badge-${row.status === 'Active' ? 'green' : row.status === 'Under Maintenance' ? 'blue' : 'red'}`}>{row.status}</span></td>
                  <td>{row.type}</td>
                  <td>{row.lastMaintenance ? new Date(row.lastMaintenance).toLocaleDateString() : 'Never'}</td>
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
