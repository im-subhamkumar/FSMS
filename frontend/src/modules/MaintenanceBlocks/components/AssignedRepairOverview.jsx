import React, { useState, useEffect } from 'react';
import './AssignedRepairOverview.css';
import { ArrowRight } from 'lucide-react';

export default function AssignedRepairOverview() {
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = () => {
      const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;
      fetch(`${API_URL}/maintenance/assigned-repairs`)
        .then(res => res.json())
        .then(data => {
          setRepairs(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch repairs', err);
          setLoading(false);
        });
    }
    fetchData();
    window.addEventListener('refresh-maintenance', fetchData);
    return () => window.removeEventListener('refresh-maintenance', fetchData);
  }, []);

  return (
    <div className="card">
      <div className="section-title">
        <span>Assigned Repair Overview</span>
        <a href="#!" className="view-all" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('open-modal', { detail: { type: 'repairs', title: 'Assigned Repairs Overview' } })); }}>View All <ArrowRight size={14} /></a>
      </div>
      
      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading assigned repairs...</div>
      ) : repairs.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No assigned repairs currently.</div>
      ) : (
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Plane</th>
              <th>Issue</th>
              <th>Assigned AME</th>
              <th>Due Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {repairs.map((row, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{row.id}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="text-muted" style={{ fontSize: '0.8rem', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.issue}</span>
                    <span className={`badge badge-${row.badgeColor}`} style={{ fontSize: '0.65rem' }}>{row.badge}</span>
                  </div>
                </td>
                <td style={{ fontSize: '0.8rem' }}>{row.ame}</td>
                <td style={{ fontSize: '0.8rem', color: row.due.includes('Today') ? 'var(--accent-orange)' : 'var(--text-main)' }}>{row.due}</td>
                <td><span className={`badge badge-${row.statusColor}`}>{row.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '16px' }}>
        *Approved assignments will reflect in Fleet Status.
      </div>
    </div>
  );
}
