import React, { useState, useEffect } from 'react';
import MapComponent from './components/MapComponent';
import Sidebar from './components/Sidebar';
import { fetchEarthquakes } from './services/seismicService';

function App() {
  const [earthquakes, setEarthquakes] = useState([]);
  const [selectedQuake, setSelectedQuake] = useState(null);
  const [alertQuake, setAlertQuake] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 1. Cargar datos históricos iniciales (REST API)
  const loadHistoricalData = async () => {
    try {
      const data = await fetchEarthquakes();
      setEarthquakes(data);
    } catch (e) {
      console.error('Error cargando historial:', e);
    }
  };

  useEffect(() => {
    loadHistoricalData();
    // Polling de respaldo cada 5 minutos
    const interval = setInterval(loadHistoricalData, 300000);
    return () => clearInterval(interval);
  }, []);

  // 2. Escuchar sismos en tiempo real por WebSockets (EMSC)
  useEffect(() => {
    let socket;
    let reconnectTimeout;

    const connectWebSocket = () => {
      socket = new WebSocket('wss://www.seismicportal.eu/standing_order/websocket');

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          // Solo procesar si es un evento de creación ('create')
          if (msg.action === 'create' && msg.data) {
            const quake = msg.data;
            const [lon, lat] = quake.geometry.coordinates;
            const mag = quake.properties.mag;
            const region = quake.properties.flynn_region || '';
            const place = quake.properties.place || region || 'Sismo en Venezuela';
            
            // Verificar si cae en el recuadro de Venezuela o si el texto lo menciona
            const isVenezuela = 
              (lat >= 0.5 && lat <= 13.5 && lon >= -73.5 && lon <= -59.5) ||
              region.toLowerCase().includes('venezuela') ||
              place.toLowerCase().includes('venezuela');

            if (isVenezuela && mag >= 4.0) {
              // Formatear al estándar compatible
              const formattedQuake = {
                id: quake.id,
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [lon, lat, quake.properties.depth]
                },
                properties: {
                  mag: mag,
                  place: place,
                  time: new Date(quake.properties.time).getTime(),
                  url: quake.properties.url || ''
                }
              };

              // Lanzar Alerta Global
              setAlertQuake(formattedQuake);

              // Reproducir Sonido de Alarma
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/989/989-preview.mp3');
              audio.play().catch(e => console.log('Autoplay bloqueado', e));

              // Vibración en el teléfono (Vibrate API)
              if (navigator.vibrate) {
                // Patrón: Vibra 500ms, descansa 250ms, vibra 500ms, descansa 250ms, vibra 1s
                navigator.vibrate([500, 250, 500, 250, 1000]);
              }

              // Agregar al inicio del array y ordenar
              setEarthquakes(prev => {
                if (prev.some(q => q.id === formattedQuake.id)) return prev;
                return [formattedQuake, ...prev].sort((a, b) => b.properties.time - a.properties.time);
              });
            }
          }
        } catch (e) {
          console.error('Error procesando mensaje WebSocket:', e);
        }
      };

      socket.onclose = () => {
        console.log('Conexión de WebSocket cerrada. Reconectando en 5 segundos...');
        reconnectTimeout = setTimeout(connectWebSocket, 5000);
      };

      socket.onerror = (err) => {
        console.error('Error de WebSocket:', err);
        socket.close();
      };
    };

    connectWebSocket();

    return () => {
      if (socket) socket.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  const handleQuakeClick = (quake) => {
    setSelectedQuake(quake);
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className={`app-container ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <button 
        className="mobile-menu-btn" 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        title="Menú"
      >
        {isSidebarOpen ? '✕' : '☰'}
      </button>
      
      <div className={`sidebar-wrapper ${isSidebarOpen ? 'open' : ''}`}>
        <Sidebar earthquakes={earthquakes} onQuakeClick={handleQuakeClick} />
      </div>
      <MapComponent earthquakes={earthquakes} onQuakeClick={handleQuakeClick} />
      
      {/* Ventana emergente de Alerta Global */}
      {alertQuake && (
        <div className="global-alert-overlay">
          <div className="global-alert-box">
            <h2 className="alert-title">⚠️ ¡ALERTA SÍSMICA! ⚠️</h2>
            <div className="alert-mag">M {alertQuake.properties.mag.toFixed(1)}</div>
            <p className="alert-place">{alertQuake.properties.place}</p>
            <p className="alert-time">{new Date(alertQuake.properties.time).toLocaleTimeString('es-VE')} (Hora Local)</p>
            <button className="alert-btn" onClick={() => setAlertQuake(null)}>ENTENDIDO</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
