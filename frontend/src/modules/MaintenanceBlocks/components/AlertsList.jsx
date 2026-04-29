import React, { useState, useEffect } from 'react';
import { ArrowRight, BellRing } from 'lucide-react';
import './AlertsList.css';

export default function AlertsList() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = () => {
      const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;
      fetch(`${API_URL}/maintenance/squawks`)
        .then(res => res.json())
        .then(data => {
          setAlerts(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch squawks', err);
          setLoading(false);
        });
    }
    fetchData();
    window.addEventListener('refresh-maintenance', fetchData);
    return () => window.removeEventListener('refresh-maintenance', fetchData);
  }, []);

  const getAlertColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'red';
      case 'major': return 'orange';
      case 'normal': return 'green';
      default: return 'muted';
    }
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return 'Unknown';
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    let interval = seconds / 3600;
    if (interval > 24) return Math.floor(interval / 24) + ' days ago';
    if (interval >= 1) return Math.floor(interval) + ' hrs ago';
    return Math.floor(seconds / 60) + ' mins ago';
  };

  return (
    <div className="card">
      <div className="section-title">
        <span>Alerts & Due Dates</span>
        <a href="#!" className="view-all" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('open-modal', { detail: { type: 'calendar', title: 'Maintenance Alerts Calendar' } })); }}>View Calendar <ArrowRight size={14} /></a>
      </div>
      
      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading alerts...</div>
      ) : alerts.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No open alerts.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {alerts.map((alert, i) => {
            const color = getAlertColor(alert.severity);
            return (
              <div key={alert.id || i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderRadius: '8px',
                border: `1px solid var(--accent-${color}-bg)`,
                backgroundColor: `rgba(var(--accent-${color}-rgb), 0.05)`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '50%' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: `var(--accent-${color})` }}></span>
                    {alert.aircraft?.name || 'Unknown'}
                  </span>
                  <span className="text-muted" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{alert.issue}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>Reported: {timeAgo(alert.createdAt)}</span>
                  <span style={{ color: `var(--accent-${color})`, fontSize: '0.8rem', fontWeight: 500, width: '60px', textAlign: 'right' }}>{alert.severity}</span>
                  <BellRing size={16} color={`var(--accent-${color})`} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
