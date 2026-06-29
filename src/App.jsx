import React, { useState, useEffect, useRef } from 'react';
import MapComponent from './components/MapComponent';
import Sidebar from './components/Sidebar';
import { fetchEarthquakes } from './services/seismicService';

function App() {
  const [earthquakes, setEarthquakes] = useState([]);
  const [selectedQuake, setSelectedQuake] = useState(null);
  const [alertQuake, setAlertQuake] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [appStarted, setAppStarted] = useState(false);

  // Variables para el sintetizador de la alarma
  const audioCtxRef = useRef(null);
  const osc1Ref = useRef(null);
  const osc2Ref = useRef(null);
  const masterGainRef = useRef(null);

  // 1. Cargar datos históricos iniciales (REST API)
  const loadHistoricalData = async () => {
    try {
      const data = await fetchEarthquakes();
      setEarthquakes(data);
    } catch (e) {
      console.error('Error cargando historial:', e);
    }
  };

  // Función para reproducir una alarma terrorífica (Tono EAS) usando el navegador
  const playTerrifyingAlarm = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    stopTerrifyingAlarm();

    const ctx = audioCtxRef.current;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const masterGain = ctx.createGain();

    // Tonos disonantes (853Hz y 960Hz) que generan miedo/alerta de forma natural (Estándar EAS)
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(853, ctx.currentTime);
    
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(960, ctx.currentTime);

    // Volumen general para que no sature
    masterGain.gain.setValueAtTime(0.5, ctx.currentTime);

    osc1.connect(masterGain);
    osc2.connect(masterGain);
    masterGain.connect(ctx.destination);

    osc1.start();
    osc2.start();

    osc1Ref.current = osc1;
    osc2Ref.current = osc2;
    masterGainRef.current = masterGain;
  };

  const stopTerrifyingAlarm = () => {
    if (osc1Ref.current) {
      try { osc1Ref.current.stop(); } catch(e){}
      osc1Ref.current = null;
    }
    if (osc2Ref.current) {
      try { osc2Ref.current.stop(); } catch(e){}
      osc2Ref.current = null;
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

              // Reproducir Sonido de Alarma Terrorífica
              playTerrifyingAlarm();

              // Vibración en el teléfono (Vibrate API)
              if (navigator.vibrate) {
                // Patrón: Vibra 500ms, descansa 250ms, vibra 500ms, descansa 250ms, vibra 1s
                navigator.vibrate([500, 250, 500, 250, 1000]);
              }

              // Notificación de sistema (Navegadores y PWA)
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('⚠️ ALERTA SÍSMICA ⚠️', {
                  body: `M ${mag.toFixed(1)} - ${place}`,
                  icon: '/icon.png',
                  requireInteraction: true
                });
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

  // Función de prueba para simular alerta
  const simulateAlert = () => {
    const fakeQuake = {
      id: 'test-alert-' + Date.now(),
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-66.9036, 10.4806, 15] },
      properties: { mag: 6.2, place: 'Caracas, Venezuela (SIMULACRO)', time: Date.now(), url: '' }
    };
    setAlertQuake(fakeQuake);
    playTerrifyingAlarm();
    if (navigator.vibrate) navigator.vibrate([500, 250, 500, 250, 1000]);
  };

  const closeAlert = () => {
    stopTerrifyingAlarm();
    setAlertQuake(null);
  };

  const startApp = async () => {
    // 1. Iniciar AudioContext
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }
    
    // 2. Pedir permisos de notificaciones del navegador/sistema
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      try {
        await Notification.requestPermission();
      } catch(e) {}
    }

    setAppStarted(true);
  };

  if (!appStarted) {
    return (
      <div className="welcome-modal">
        <div className="welcome-content">
          <h1>¡Bienvenido a Sismo Detector!</h1>
          <p>Para recibir <strong>alertas de emergencia, sonidos y notificaciones</strong> en tiempo real, necesitamos tu autorización.</p>
          <ul style={{ textAlign: 'left', margin: '20px auto', width: 'fit-content', color: 'var(--text-secondary)' }}>
            <li>📍 Permiso de <strong>Ubicación</strong> para el mapa</li>
            <li>🔊 Permiso de <strong>Sonido</strong> (Evita bloqueos del navegador)</li>
            <li>🔔 Permiso de <strong>Notificaciones</strong> emergentes</li>
          </ul>
          <button className="start-btn" onClick={startApp}>Conceder Permisos y Entrar</button>
        </div>
      </div>
    );
  }

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
      
      {/* Botón flotante para pruebas en localhost */}
      <button 
        onClick={simulateAlert}
        style={{ position: 'absolute', bottom: '30px', left: '30px', zIndex: 9999, background: '#dc2626', color: 'white', padding: '12px 20px', borderRadius: '8px', border: '2px solid white', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
      >
        🚨 Simular Alarma
      </button>

      {/* Ventana emergente de Alerta Global */}
      {alertQuake && (
        <div className="global-alert-overlay">
          <div className="global-alert-box">
            <h2 className="alert-title">⚠️ ¡ALERTA SÍSMICA! ⚠️</h2>
            <div className="alert-mag">M {alertQuake.properties.mag.toFixed(1)}</div>
            <p className="alert-place">{alertQuake.properties.place}</p>
            <p className="alert-time">{new Date(alertQuake.properties.time).toLocaleTimeString('es-VE')} (Hora Local)</p>
            <button className="alert-btn" onClick={closeAlert}>ENTENDIDO</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
