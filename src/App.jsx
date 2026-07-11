import React, { useState, useEffect, useRef } from 'react';
import MapComponent from './components/MapComponent';
import Sidebar from './components/Sidebar';
import { fetchEarthquakes } from './services/seismicService';
import { X, Menu } from 'lucide-react';

// Función para calcular distancia en km entre dos coordenadas (Haversine)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

function App() {
  const [earthquakes, setEarthquakes] = useState([]);
  const [selectedQuake, setSelectedQuake] = useState(null);
  const [alertQuake, setAlertQuake] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [appStarted, setAppStarted] = useState(false);

  // Variables para el sintetizador de la alarma
  const audioCtxRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const osc1Ref = useRef(null);
  const osc2Ref = useRef(null);
  const masterGainRef = useRef(null);
  const userLocationRef = useRef(null);

  // Obtener ubicación en tiempo real del usuario
  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          userLocationRef.current = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
        },
        (error) => {
          console.warn('Error obteniendo ubicación GPS:', error);
        },
        { enableHighAccuracy: true, maximumAge: 60000, timeout: 10000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

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
    // Activar modo segundo plano si estamos en Capacitor/Cordova
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.backgroundMode) {
      window.cordova.plugins.backgroundMode.enable();
      window.cordova.plugins.backgroundMode.on('activate', () => {
         window.cordova.plugins.backgroundMode.disableWebViewOptimizations();
      });
      window.cordova.plugins.backgroundMode.setDefaults({
          title: 'SismoDetector Activo',
          text: 'Escuchando sismos en segundo plano',
          icon: 'icon', 
          color: 'F14E4E', 
          resume: true,
          hidden: false,
          bigText: true
      });
    }

    loadHistoricalData();
    // Polling de respaldo cada 5 minutos
    const interval = setInterval(loadHistoricalData, 300000);
    return () => clearInterval(interval);
  }, []);

  // 2. Escuchar sismos en tiempo real por WebSockets (EMSC)
  useEffect(() => {
    window.triggerTestQuake = () => {
      const mag = 4.5;
      const place = 'Caracas, Distrito Capital (PRUEBA ALARMA)';
      const lat = 10.4806;
      const lon = -66.9036;
      const formattedQuake = {
        id: 'test-' + Date.now(),
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lon, lat, 10] },
        properties: { mag, place, time: Date.now(), url: '' }
      };

      const p = place.toLowerCase();
      const capitalKeywords = ['caracas', 'miranda', 'guaira', 'vargas', 'teques', 'guarenas', 'guatire', 'catia', 'maiquetia', 'caraballeda', 'naiguata', 'macuto', 'cua', 'charallave', 'petare', 'chacao', 'baruta', 'hatillo'];
      const hasKeyword = capitalKeywords.some(k => p.includes(k));
      const distToCaracas = calculateDistance(lat, lon, 10.4806, -66.9036);
      const isCapitalRegion = hasKeyword || distToCaracas <= 120;

      if (isCapitalRegion) {
        setAlertQuake(formattedQuake);
        playTerrifyingAlarm();
        if (navigator.vibrate) navigator.vibrate([500, 250, 500, 250, 1000]);
      }
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(isCapitalRegion ? '⚠️ ALERTA SÍSMICA CAPITAL ⚠️' : 'Información Sísmica', {
          body: `M ${mag.toFixed(1)} - ${place}`,
          icon: '/icon.png',
          requireInteraction: isCapitalRegion,
          silent: !isCapitalRegion
        });
      }
      
      setEarthquakes(prev => [formattedQuake, ...prev]);
    };
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

            // Verificar si está a menos de 300km del usuario
            let within300km = false;
            if (userLocationRef.current) {
              const distance = calculateDistance(lat, lon, userLocationRef.current.lat, userLocationRef.current.lon);
              if (distance <= 300) {
                within300km = true;
              }
            }

            if ((isVenezuela || within300km) && mag >= 3.6) {
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

              // Check if it's in the Capital Region (Caracas, La Guaira, Miranda)
              const p = place.toLowerCase();
              const capitalKeywords = ['caracas', 'miranda', 'guaira', 'vargas', 'teques', 'guarenas', 'guatire', 'catia', 'maiquetia', 'caraballeda', 'naiguata', 'macuto', 'cua', 'charallave', 'petare', 'chacao', 'baruta', 'hatillo'];
              const hasKeyword = capitalKeywords.some(k => p.includes(k));
              const distToCaracas = calculateDistance(lat, lon, 10.4806, -66.9036);
              const isCapitalRegion = hasKeyword || distToCaracas <= 120;

              if (isCapitalRegion) {
                // Lanzar Alerta Global Fuerte
                setAlertQuake(formattedQuake);
                playTerrifyingAlarm();
                if (navigator.vibrate) {
                  navigator.vibrate([500, 250, 500, 250, 1000]);
                }
              }

              // Notificación de sistema (Navegadores y PWA)
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(isCapitalRegion ? '⚠️ ALERTA SÍSMICA CAPITAL ⚠️' : 'Información Sísmica', {
                  body: `M ${mag.toFixed(1)} - ${place}`,
                  icon: '/icon.png',
                  requireInteraction: isCapitalRegion,
                  silent: !isCapitalRegion
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
    <div className="app-container sidebar-open">
      <Sidebar earthquakes={earthquakes} onQuakeClick={handleQuakeClick} onClose={() => {}} />
      <MapComponent earthquakes={earthquakes} onQuakeClick={handleQuakeClick} />
      


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
