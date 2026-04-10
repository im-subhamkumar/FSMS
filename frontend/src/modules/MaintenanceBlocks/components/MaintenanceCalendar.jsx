import React, { useState, useEffect } from 'react';
import './MaintenanceCalendar.css';

export default function MaintenanceCalendar() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const [squawksRes, activitiesRes] = await Promise.all([
          fetch(`${API_URL}/maintenance/squawks`),
          fetch(`${API_URL}/maintenance/activities`)
        ]);
        const squawks = await squawksRes.json();
        const activities = await activitiesRes.json();
        
        let allItems = [];
        if (Array.isArray(squawks)) {
          allItems = [...allItems, ...squawks.map(s => ({ ...s, type: 'squawk', date: new Date(s.createdAt) }))];
        }
        if (Array.isArray(activities)) {
          allItems = [...allItems, ...activities.map(a => ({ ...a, type: 'activity', date: new Date(a.date || a.createdAt) }))];
        }
        setItems(allItems);
      } catch (err) {
        console.error('Calendar fetch error', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  // Generate calendar grid
  const days = [];
  for (let i = 0; i < firstDayIndex; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const monthName = today.toLocaleString('default', { month: 'long', year: 'numeric' });

  const selectedItems = items.filter(it => it.date.getDate() === selectedDate && it.date.getMonth() === currentMonth && it.date.getFullYear() === currentYear);

  return (
    <div className="calendar-split-view">
      <div className="calendar-left">
        <div className="calendar-header">
          <h3 style={{ margin: 0, fontWeight: 600 }}>{monthName}</h3>
          <div className="legend">
            <span className="legend-item"><div className="dot red"></div> Squawks</span>
            <span className="legend-item"><div className="dot blue"></div> Activities</span>
          </div>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading schedule...</div>
        ) : (
          <div className="calendar-grid">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="calendar-day-name">{d}</div>
            ))}
            {days.map((day, idx) => {
              if (!day) return <div key={idx} className="calendar-cell empty"></div>;
              
              const cellItems = items.filter(it => it.date.getDate() === day && it.date.getMonth() === currentMonth && it.date.getFullYear() === currentYear);
              
              const isToday = day === today.getDate();
              const isSelected = day === selectedDate;
              
              return (
                <div 
                  key={idx} 
                  className={`calendar-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedDate(day)}
                >
                  <span className="day-number">{day}</span>
                  <div className="cell-items">
                    {cellItems.map((item, i) => (
                      <div key={i} className={`calendar-item ${item.type === 'squawk' ? 'item-squawk' : 'item-activity'}`}>
                        {item.type === 'squawk' ? `${item.aircraft?.name || 'Plane'} ${item.severity}` : `Log: ${item.aircraft?.name || 'Activity'}`}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="calendar-right">
        <h4 className="side-panel-title">Details for {monthName} {selectedDate}</h4>
        <div className="side-panel-content">
          {loading ? (
            <div className="text-muted" style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
          ) : selectedItems.length === 0 ? (
            <div className="empty-state">
               <span style={{ fontSize: '2rem', opacity: 0.5, marginBottom: '12px', display: 'block' }}>📅</span>
               <div className="text-muted">No scheduled maintenance tasks or squawks reported on this date.</div>
            </div>
          ) : (
            selectedItems.map((item, i) => (
              <div key={i} className="detail-card">
                <div className="detail-header">
                  <span className="detail-tail">{item.aircraft?.name || 'Log Entry'}</span>
                  <span className={`badge badge-${item.type === 'squawk' ? (item.severity === 'Critical' ? 'red' : 'orange') : 'blue'}`}>
                    {item.type === 'squawk' ? item.severity : 'Activity'}
                  </span>
                </div>
                <div className="detail-issue">
                  {item.issue || item.description}
                </div>
                {item.type === 'squawk' && (
                  <div className="detail-footer">
                    <span>Reported: {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>Status: {item.status}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
