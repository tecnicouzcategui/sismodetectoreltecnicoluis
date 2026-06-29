import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { X, MapPin, Clock, ArrowDown, Activity, Plus, Minus, Mountain, Satellite, Map as MapIcon } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';

// mag: magnitud del sismo, rank: número de cuenta regresiva (1 = más reciente)
const createPulseIcon = (mag, rank) => {
  let magClass = 'mag-2';
  if (mag >= 3 && mag < 4) magClass = 'mag-3';
  if (mag >= 4 && mag < 5) magClass = 'mag-4';
  if (mag >= 5) magClass = 'mag-5';
  const size = Math.max(36, mag * 9);
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="pulse-ring ${magClass}" style="width:${size}px;height:${size}px;position:relative;display:flex;align-items:center;justify-content:center;">
        <span class="marker-rank">${rank}</span>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
};

const getMagColor = (mag) => {
  if (mag >= 5) return '#dc2626';
  if (mag >= 4) return '#f87171';
  if (mag >= 3) return '#facc15';
  return '#4ade80';
};

const getMagLabel = (mag) => {
  if (mag >= 6) return 'FUERTE';
  if (mag >= 5) return 'MODERADO-FUERTE';
  if (mag >= 4) return 'MODERADO';
  if (mag >= 3) return 'LEVE';
  return 'MICRO';
};

// Controles personalizados de Zoom y Capas
const CustomMapControls = ({ mapStyle, setMapStyle }) => {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useEffect(() => {
    const onZoom = () => setZoom(map.getZoom());
    map.on('zoom', onZoom);
    return () => map.off('zoom', onZoom);
  }, [map]);

  return (
    <div className="custom-map-controls">
      {/* Botones de Capas */}
      <div className="layer-switcher">
        <button className={mapStyle === 'base' ? 'active' : ''} onClick={() => setMapStyle('base')} title="Mapa Base">
          <MapIcon size={18} />
        </button>
        <button className={mapStyle === 'satellite' ? 'active' : ''} onClick={() => setMapStyle('satellite')} title="Satélite">
          <Satellite size={18} />
        </button>
        <button className={mapStyle === 'terrain' ? 'active' : ''} onClick={() => setMapStyle('terrain')} title="Relieve">
          <Mountain size={18} />
        </button>
      </div>

      {/* Control de Zoom de Precisión */}
      <div className="zoom-slider-container">
        <button onClick={() => map.setZoom(zoom + 0.5)}><Plus size={16} /></button>
        <div className="slider-wrapper">
          <input 
            type="range" 
            min="4" 
            max="12" 
            step="0.1" 
            value={zoom} 
            onChange={(e) => map.setZoom(parseFloat(e.target.value))}
            className="vertical-slider"
          />
        </div>
        <button onClick={() => map.setZoom(zoom - 0.5)}><Minus size={16} /></button>
      </div>
    </div>
  );
};

const MapComponent = ({ earthquakes }) => {
  const [selectedQuake, setSelectedQuake] = useState(null);
  const [venezuelaGeo, setVenezuelaGeo] = useState(null);
  const [mapStyle, setMapStyle] = useState('base'); // base, satellite, terrain
  const [userLocation, setUserLocation] = useState(null);
  const center = [7.5, -66.5];

  // Cargar GeoJSON
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/apache/superset/master/superset-frontend/plugins/legacy-plugin-chart-country-map/src/countries/venezuela.geojson')
      .then(r => r.json())
      .then(data => setVenezuelaGeo(data))
      .catch(err => console.error('Error cargando GeoJSON de Venezuela:', err));
  }, []);

  // Cargar ubicación del usuario (Capacitor Geolocation)
  useEffect(() => {
    const requestLocation = async () => {
      try {
        const permissions = await Geolocation.checkPermissions();
        if (permissions.location !== 'granted') {
          const request = await Geolocation.requestPermissions();
          if (request.location !== 'granted') return;
        }

        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true
        });

        setUserLocation([position.coords.latitude, position.coords.longitude]);
      } catch (err) {
        console.warn('Geolocalización no soportada o denegada:', err);
      }
    };

    requestLocation();
  }, []);

  // Determinar la URL del mapa según el estilo seleccionado
  let tileUrl = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
  if (mapStyle === 'satellite') tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  if (mapStyle === 'terrain') tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}";

  // Ajustar la transparencia de Venezuela si no estamos en el mapa base para poder ver el satélite/relieve
  const venezuelaStyle = {
    fillColor: '#001133',
    fillOpacity: mapStyle === 'base' ? 0.85 : 0.15,
    color: '#3b82f6',
    weight: 1.2,
    opacity: mapStyle === 'base' ? 0.8 : 0.6,
  };

  return (
    <div className="map-container">
      <MapContainer
        center={center}
        zoom={6}
        zoomControl={false}
        zoomSnap={0.1} // Permite zoom decimal ultra preciso
        zoomDelta={0.5}
        style={{ height: '100%', width: '100%' }}
      >
        <CustomMapControls mapStyle={mapStyle} setMapStyle={setMapStyle} />

        <TileLayer
          url={tileUrl}
          attribution='&copy; OpenStreetMap &copy; CARTO &copy; Esri'
        />

        {venezuelaGeo && (
          <GeoJSON
            data={venezuelaGeo}
            style={venezuelaStyle}
            interactive={false}
          />
        )}

        {/* Marcador del Usuario */}
        {userLocation && (
          <Marker 
            position={userLocation}
            icon={L.divIcon({
              className: 'user-marker',
              html: `<div class="user-pulse"></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })}
          >
            <Tooltip permanent direction="top" offset={[0, -10]}>
              Estás Aquí
            </Tooltip>
          </Marker>
        )}

        {earthquakes.map((quake, index) => {
          const { id, properties, geometry } = quake;
          const [lng, lat] = geometry.coordinates;
          const mag = properties.mag;
          const rank = index + 1;
          return (
            <Marker
              key={id}
              position={[lat, lng]}
              icon={createPulseIcon(mag, rank)}
              eventHandlers={{ click: () => setSelectedQuake(quake) }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                <strong>#{rank} · M {mag?.toFixed(1)}</strong> — {properties.place}
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Ventana emergente personalizada con glassmorphism */}
      {selectedQuake && (() => {
        const { properties, geometry } = selectedQuake;
        const [lng, lat, depth] = geometry.coordinates;
        const mag = properties.mag;
        const color = getMagColor(mag);
        const label = getMagLabel(mag);
        const time = new Date(properties.time);
        return (
          <div className="custom-popup-overlay" onClick={() => setSelectedQuake(null)}>
            <div className="custom-popup-card" style={{ '--mag-color': color }} onClick={e => e.stopPropagation()}>
              <button className="popup-close" onClick={() => setSelectedQuake(null)}>
                <X size={18} />
              </button>
              <div className="popup-ring-deco" style={{ borderColor: color, boxShadow: `0 0 30px ${color}44` }}></div>
              <div className="popup-mag-hero">
                <div className="popup-mag-value" style={{ color, textShadow: `0 0 20px ${color}88` }}>
                  M {mag?.toFixed(1)}
                </div>
                <div className="popup-mag-badge" style={{ background: `${color}22`, border: `1px solid ${color}`, color }}>
                  {label}
                </div>
              </div>
              <div className="popup-divider" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}></div>
              <div className="popup-details">
                <div className="popup-detail-row">
                  <MapPin size={15} style={{ color, flexShrink: 0 }} />
                  <span>{properties.place}</span>
                </div>
                <div className="popup-detail-row">
                  <Clock size={15} style={{ color, flexShrink: 0 }} />
                  <span>{time.toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="popup-detail-row">
                  <Activity size={15} style={{ color, flexShrink: 0 }} />
                  <span>{time.toLocaleTimeString('es-VE')} <em style={{ color: 'var(--text-secondary)', fontSize: '0.8em' }}>(hora local)</em></span>
                </div>
                <div className="popup-detail-row">
                  <ArrowDown size={15} style={{ color, flexShrink: 0 }} />
                  <span>Profundidad: <strong style={{ color }}>{depth?.toFixed(1)} km</strong></span>
                </div>
              </div>
              <div className="popup-coords">
                <span>Lat: {lat.toFixed(4)}°</span>
                <span>·</span>
                <span>Lng: {lng.toFixed(4)}°</span>
              </div>
              <div className="popup-footer">
                Monitor Sismico @eltecnicoluis · Fuente: USGS
              </div>
            </div>
          </div>
        );
      })()}

      {/* Resumen Superior Derecho */}
      <div className="summary-overlay">
        <div className="summary-title">Sismos (+4.0)</div>
        <div className="summary-count">{earthquakes.length}</div>
        <div className="summary-subtitle">desde el 24 de Jun. 2026</div>
      </div>

      <div className="map-overlay">
        Últimos 30 días · Solo M4.0+ · @eltecnicoluis
      </div>
    </div>
  );
};

export default MapComponent;
