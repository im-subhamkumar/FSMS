import React from 'react';
import './Header.css';

export default function Header() {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 6px 0', color: 'var(--text-main)' }}>Maintenance Dashboard</h1>
        <p className="text-muted" style={{ fontSize: '0.9rem', margin: 0 }}>
          Overview of fleet health, maintenance activities, and assignments
        </p>
      </div>
    </div>
  );
}
