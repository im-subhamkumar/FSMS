import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Users, Calendar, ArrowRight } from 'lucide-react';
import './StatCards.css';

export default function StatCards() {
  const [statsData, setStatsData] = useState({
    airworthy: 0,
    grounded: 0,
    openSquawks: 0,
    criticalSquawks: 0,
    maintenanceDueCount: 0
  });

  useEffect(() => {
    const fetchData = () => {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      fetch(`${API_URL}/maintenance/stats`)
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) setStatsData(data);
        })
        .catch(err => console.error('Failed to fetch stats', err));
    }
    fetchData();
    window.addEventListener('refresh-maintenance', fetchData);
    return () => window.removeEventListener('refresh-maintenance', fetchData);
  }, []);

  const stats = [
    { title: 'Airworthy Aircraft', value: statsData.airworthy, icon: <CheckCircle2 size={24} color="var(--accent-green)" />, badge: { text: 'Fleet Ready', color: 'green' } },
    { title: 'Grounded (AOG)', value: statsData.grounded, icon: <AlertCircle size={24} color="var(--accent-red)" />, badge: { text: 'Needs Attention', color: 'red' } },
    { title: 'Open Squawks', value: statsData.openSquawks, icon: <AlertTriangle size={24} color="var(--accent-yellow)" />, badge: { text: `${statsData.criticalSquawks} Critical`, color: 'yellow' } }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
      {stats.map((stat, i) => (
        <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {stat.icon}
            <span style={{ fontSize: '1.75rem', fontWeight: 600 }}>{stat.value}</span>
          </div>
          <div className="text-muted" style={{ fontSize: '0.9rem' }}>{stat.title}</div>
          <div>
            <span className={`badge badge-${stat.badge.color}`}>{stat.badge.text}</span>
          </div>
        </div>
      ))}
      
      {/* Maintenance Due Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div className="text-muted" style={{ fontSize: '0.9rem' }}>Maintenance Due</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0' }}>
          <Calendar size={24} color="var(--accent-blue)" />
          <span style={{ fontSize: '1.75rem', fontWeight: 600 }}>{statsData.maintenanceDueCount}</span>
        </div>
        <div className="text-muted" style={{ fontSize: '0.75rem' }}>Due In Next 10 Hours</div>
        <div style={{ marginTop: 'auto', textAlign: 'right', paddingTop: '8px' }}>
          <a href="#!" className="view-all" style={{ justifyContent: 'flex-end' }} onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('open-modal', { detail: { type: 'calendar', title: 'Maintenance Schedule' } })); }}>View Schedule <ArrowRight size={14} /></a>
        </div>
      </div>
    </div>
  );
}
