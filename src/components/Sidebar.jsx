import React from 'react';
import { Activity, X } from 'lucide-react';

const Sidebar = ({ earthquakes, onQuakeClick, onClose }) => {
  
  const getMagColor = (mag) => {
    if (mag >= 5) return 'var(--mag-extreme)';
    if (mag >= 4) return 'var(--mag-high)';
    if (mag >= 3) return 'var(--mag-med)';
    return 'var(--mag-low)';
  };

  const getMagBg = (mag) => {
    if (mag >= 5) return 'rgba(220, 38, 38, 0.2)';
    if (mag >= 4) return 'rgba(248, 113, 113, 0.2)';
    if (mag >= 3) return 'rgba(250, 204, 21, 0.2)';
    return 'rgba(74, 222, 128, 0.2)';
  };

  const timeAgo = (dateString) => {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " años";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " meses";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " días";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " min";
    return Math.floor(seconds) + " seg";
  };

  return (
    <div className="full-screen-sidebar">
      <button className="close-btn" onClick={onClose} aria-label="Cerrar menú">
        <X size={24} />
      </button>
      <div className="sidebar-header">
        <Activity className="icon" size={24} />
        <h1>Monitor Sismico @eltecnicoluis</h1>
        <button 
          onClick={() => window.triggerTestQuake && window.triggerTestQuake()} 
          style={{background:'#444', color:'white', fontSize:'10px', padding:'2px 5px', borderRadius:'4px', marginLeft:'10px'}}
        >
          Prueba
        </button>
      </div>
      <div className="quake-list">
        {earthquakes.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Cargando datos o sin sismos recientes...
          </div>
        ) : (
          earthquakes.map((quake) => {
            const mag = quake.properties.mag;
            return (
              <div 
                key={quake.id} 
                className="quake-item"
                onClick={() => onQuakeClick(quake)}
              >
                <div 
                  className="mag-badge" 
                  style={{ 
                    color: getMagColor(mag), 
                    backgroundColor: getMagBg(mag),
                    border: `1px solid ${getMagColor(mag)}`
                  }}
                >
                  {mag.toFixed(1)}
                </div>
                <div className="quake-info">
                  <div className="quake-place">{quake.properties.place}</div>
                  <div className="quake-meta">
                    <span>hace {timeAgo(quake.properties.time)}</span>
                    <span>{quake.geometry.coordinates[2].toFixed(1)} km</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Sidebar;
