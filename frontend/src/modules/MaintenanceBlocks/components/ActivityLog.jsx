import React, { useState, useEffect } from 'react';
import './ActivityLog.css';

export default function ActivityLog() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = () => {
      const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;
      fetch(`${API_URL}/maintenance/activities`)
        .then(res => res.json())
        .then(data => {
          setActivities(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch activities', err);
          setLoading(false);
        });
    }
    fetchData();
    window.addEventListener('refresh-maintenance', fetchData);
    return () => window.removeEventListener('refresh-maintenance', fetchData);
  }, []);

  const timeAgo = (dateStr) => {
    if (!dateStr) return 'Unknown';
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    let interval = seconds / 3600;
    if (interval > 24) return Math.floor(interval / 24) + ' days ago';
    if (interval >= 1) return Math.floor(interval) + ' hrs ago';
    return Math.floor(seconds / 60) + ' mins ago';
  };

  const getIconColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'alert': return 'var(--accent-red)';
      case 'success':
      case 'complete': return 'var(--accent-green)';
      default: return 'var(--accent-blue)';
    }
  };

  return (
    <div className="card" style={{ marginTop: '24px' }}>
      <div className="section-title" style={{ marginBottom: '24px' }}>Maintenance Activity Log</div>
      
      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading activities...</div>
      ) : activities.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No recent activities.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '24px' }}>
          {activities.map((act) => (
            <div key={act.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
               <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: getIconColor(act.type), marginTop: '6px', flexShrink: 0 }}></div>
               <div>
                 <div style={{ fontSize: '0.85rem' }}>{act.description}</div>
                 <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                   {act.user ? `${act.user.firstName} ${act.user.lastName} • ` : 'System • '}
                   {timeAgo(act.createdAt)}
                 </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
