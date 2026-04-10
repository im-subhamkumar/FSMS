import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import './RepairAssignment.css';

export default function RepairAssignment() {
  const [squawks, setSquawks] = useState([]);
  const [ames, setAmes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedAircraftId, setSelectedAircraftId] = useState(null);
  const [selectedAmeId, setSelectedAmeId] = useState(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    setLoading(true);
    
    Promise.all([
      fetch(`${API_URL}/maintenance/squawks`).then(res => res.json()),
      fetch(`${API_URL}/maintenance/ames`).then(res => res.json())
    ])
    .then(([squawksData, amesData]) => {
      // Filter squawks for aircraft that are unassigned
      const validSquawks = Array.isArray(squawksData) ? squawksData : [];
      const validAmes = Array.isArray(amesData) ? amesData : [];
      const unassignedSquawks = validSquawks.filter(s => !s.aircraft?.assignedAmeId);
      setSquawks(unassignedSquawks);
      setAmes(validAmes);
      setLoading(false);
    })
    .catch(err => {
      console.error('Failed to fetch data', err);
      setLoading(false);
    });
  };

  const handleAssign = () => {
    if (!selectedAircraftId || !selectedAmeId) return;
    setAssigning(true);
    
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    fetch(`${API_URL}/maintenance/assign-ame`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aircraftId: selectedAircraftId, ameId: selectedAmeId })
    })
    .then(res => res.json())
    .then(data => {
      setAssigning(false);
      setSelectedAircraftId(null);
      setSelectedAmeId(null);
      fetchData(); // Refresh data
      // Dispatch event to organically refresh other components on the page
      window.dispatchEvent(new Event('refresh-maintenance'));
    })
    .catch(err => {
      console.error('Failed to assign AME', err);
      setAssigning(false);
    });
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
      <div className="section-title" style={{ marginBottom: '8px' }}>Repair Assignment (AME's)</div>
      <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '20px' }}>Assign AME to aircraft for maintenance/repair</p>
      
      {/* Steps mapping */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: selectedAircraftId ? 'var(--text-muted)' : 'var(--accent-blue)' }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: selectedAircraftId ? 'transparent' : 'var(--accent-blue)', color: selectedAircraftId ? 'var(--text-muted)' : 'white', border: selectedAircraftId ? '1px solid var(--text-muted)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: selectedAircraftId ? 'normal' : 'bold' }}>1</div>
          Select Aircraft
        </div>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)', margin: '0 16px' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: selectedAircraftId && !selectedAmeId ? 'var(--accent-blue)' : 'var(--text-muted)' }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', border: selectedAircraftId && !selectedAmeId ? 'none' : '1px solid var(--text-muted)', backgroundColor: selectedAircraftId && !selectedAmeId ? 'var(--accent-blue)' : 'transparent', color: selectedAircraftId && !selectedAmeId ? 'white' : 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: selectedAircraftId && !selectedAmeId ? 'bold' : 'normal' }}>2</div>
          Select AME
        </div>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)', margin: '0 16px' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: selectedAmeId ? 'var(--accent-blue)' : 'var(--text-muted)' }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', border: selectedAmeId ? 'none' : '1px solid var(--text-muted)', backgroundColor: selectedAmeId ? 'var(--accent-blue)' : 'transparent', color: selectedAmeId ? 'white' : 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: selectedAmeId ? 'bold' : 'normal' }}>3</div>
          Review & Approve
        </div>
      </div>
      
      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <>
          <p style={{ fontSize: '0.85rem', marginBottom: '12px' }}>{squawks.length > 0 ? 'Select Aircraft with Open Squawk' : 'No unassigned open squawks'}</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', marginBottom: '16px' }}>
            {squawks.map((squawk) => {
              const isSelected = selectedAircraftId === squawk.aircraftId;
              return (
                <div 
                  key={squawk.id} 
                  onClick={() => setSelectedAircraftId(squawk.aircraftId)}
                  style={{ 
                    border: isSelected ? '1px solid var(--accent-red)' : '1px solid var(--border-color)', 
                    borderRadius: '8px', 
                    padding: '16px', 
                    backgroundColor: isSelected ? 'rgba(248, 113, 113, 0.05)' : 'transparent', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    cursor: 'pointer'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                       <span style={{ color: isSelected ? 'var(--accent-red)' : 'var(--text-muted)' }}>⤓</span>
                       <span style={{ fontWeight: 600 }}>{squawk.aircraft?.tailNumber || 'Unknown'}</span>
                       <span className="text-muted" style={{ fontSize: '0.85rem' }}>{squawk.aircraft?.type || 'Unknown'}</span>
                       <span className={`badge badge-${squawk.severity.toLowerCase() === 'critical' ? 'red' : 'orange'}`}>{squawk.severity}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Issue: {squawk.issue}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Reported: {timeAgo(squawk.reportedAt || squawk.createdAt)}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                     <div style={{ width: 16, height: 16, borderRadius: '50%', border: isSelected ? '4px solid var(--accent-blue)' : '1px solid var(--text-muted)', outline: isSelected ? '1px solid var(--accent-blue)' : 'none' }}></div>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedAircraftId && (
            <div style={{ marginBottom: '16px' }}>
               <p style={{ fontSize: '0.85rem', marginBottom: '8px' }}>Assign Available AME</p>
               <select 
                 value={selectedAmeId || ''} 
                 onChange={(e) => setSelectedAmeId(e.target.value)}
                 style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
               >
                 <option value="" disabled>Select AME</option>
                 {ames.map(ame => (
                    <option key={ame.id} value={ame.id}>Capt. {ame.firstName} {ame.lastName}</option>
                 ))}
               </select>
            </div>
          )}
          
          <button 
            disabled={!selectedAircraftId || !selectedAmeId || assigning}
            onClick={handleAssign}
            style={{ 
              width: '100%', 
              padding: '12px', 
              backgroundColor: (!selectedAircraftId || !selectedAmeId) ? 'var(--border-color)' : 'var(--accent-blue)', 
              color: (!selectedAircraftId || !selectedAmeId) ? 'var(--text-muted)' : 'white', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: (!selectedAircraftId || !selectedAmeId) ? 'not-allowed' : 'pointer', 
              fontWeight: 600, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px' 
            }}
          >
            {assigning ? 'Assigning...' : 'Assign AME'} <ArrowRight size={16} />
          </button>
        </>
      )}
    </div>
  );
}
