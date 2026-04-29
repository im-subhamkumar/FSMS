import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import './FleetStatus.css';

export default function FleetStatus() {
  const [fleetData, setFleetData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = () => {
      const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;
      fetch(`${API_URL}/maintenance/aircraft`)
        .then(res => res.json())
        .then(data => {
          setFleetData(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch aircraft', err);
          setLoading(false);
        });
    }
    fetchData();
    window.addEventListener('refresh-maintenance', fetchData);
    return () => window.removeEventListener('refresh-maintenance', fetchData);
  }, []);

  const getBadgeColor = (status) => {
    switch (status) {
      case 'Active': return 'green';
      case 'Inactive': return 'red';
      case 'Under Maintenance': return 'orange';
      default: return 'muted';
    }
  };

  return (
    <div className="card">
      <div className="section-title">
        <span>Fleet Status</span>
        <a href="#!" className="view-all" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('open-modal', { detail: { type: 'fleet', title: 'Full Fleet Status' } })); }}>View All <ArrowRight size={14} /></a>
      </div>
      
      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading fleet data...</div>
      ) : (
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Model</th>
              <th>Type</th>
              <th>Last Maintenance</th>
              <th>Status</th>
              <th>AME Assigned</th>
            </tr>
          </thead>
          <tbody>
            {fleetData.map((row, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{row.name}</td>
                <td className="text-muted">{row.model}</td>
                <td className="text-muted">{row.type}</td>
                <td style={{ color: !row.lastMaintenance ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                  {row.lastMaintenance ? new Date(row.lastMaintenance).toLocaleDateString() : 'Never'}
                </td>
                <td><span className={`badge badge-${getBadgeColor(row.status)}`}>{row.status}</span></td>
                <td className="text-muted">{row.ameAssignedStr || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ display: 'flex', gap: '16px', marginTop: '20px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent-green)' }}></span> Airworthy</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent-red)' }}></span> AOG</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent-yellow)' }}></span> In Maintenance</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--text-muted)' }}></span> Overdue</span>
      </div>
    </div>
  );
}
