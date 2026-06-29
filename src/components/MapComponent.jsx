import React, { useState, useEffect } from 'react';
import { MapContainer, Marker, Tooltip, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { X, MapPin, Clock, ArrowDown, Activity, Map as MapIcon } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';

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

const CITIES = [
  { name: 'Puerto Ayacucho', coords: [5.6667, -67.5833] },
  { name: 'Barcelona', coords: [10.1333, -64.6833] },
  { name: 'San Fernando', coords: [7.8833, -67.4667] },
  { name: 'Maracay', coords: [10.2333, -67.5833] },
  { name: 'Barinas', coords: [8.6333, -70.2833] },
  { name: 'Ciudad Bolívar', coords: [8.1167, -63.5833] },
  { name: 'Valencia', coords: [10.1620, -68.0077] },
  { name: 'San Carlos', coords: [9.6667, -68.5833] },
  { name: 'Tucupita', coords: [9.0667, -62.6500] },
  { name: 'Coro', coords: [11.4167, -69.6667] },
  { name: 'S.J. de los Morros', coords: [9.9167, -67.3667] },
  { name: 'Barquisimeto', coords: [10.0678, -69.3470] },
  { name: 'Mérida', coords: [8.5952, -71.1433] },
  { name: 'Los Teques', coords: [10.3333, -67.0333] },
  { name: 'Maturín', coords: [9.7500, -63.1833] },
  { name: 'La Asunción', coords: [11.0333, -63.8667] },
  { name: 'Guanare', coords: [9.0333, -69.7333] },
  { name: 'Cumaná', coords: [10.4667, -64.1833] },
  { name: 'San Cristóbal', coords: [7.7669, -72.2250] },
  { name: 'Trujillo', coords: [9.3667, -70.4333] },
  { name: 'La Guaira', coords: [10.6000, -66.9333] },
  { name: 'San Felipe', coords: [10.3333, -68.7333] },
  { name: 'Maracaibo', coords: [10.6427, -71.6125] },
  { name: 'Caracas', coords: [10.4806, -66.9036] },
  { name: 'Ciudad Guayana', coords: [8.3617, -62.6422] }
];

const REGION_INFO = {
  'Caracas': 'Capital y principal centro político del país.',
  'Zulia': 'Tierra del majestuoso relámpago del Catatumbo.',
  'Maracaibo': 'Tierra del majestuoso relámpago del Catatumbo.',
  'Mérida': 'Región andina con altas cumbres y nieve.',
  'Táchira': 'Pujante estado andino fronterizo.',
  'Lara': 'Capital musical de Venezuela.',
  'Barquisimeto': 'Capital musical de Venezuela, cuna del cuatro.',
  'Falcón': 'Médanos, historia colonial y playas increíbles.',
  'Carabobo': 'Importante centro industrial e histórico.',
  'Sucre': 'Costas orientales y sede del Parque Mochima.',
  'Margarita': 'Isla turística por excelencia en el Caribe.',
  'Bolívar': 'Escudo Guayanés, selva y riqueza mineral.',
  'Amazonas': 'Extensa selva tropical y tepuyes milenarios.',
  'Aragua': 'Costas hermosas y Valles floridos.',
  'Anzoátegui': 'Gran puerto oriental y balnearios hermosos.'
};

const getRegionInfo = (place) => {
  if (!place) return 'Región bajo constante monitoreo sísmico.';
  for (const [key, value] of Object.entries(REGION_INFO)) {
    if (place.includes(key)) return value;
  }
  return 'Falla geológica monitoreada en la región.';
};

const MapComponent = ({ earthquakes }) => {
  const [selectedQuake, setSelectedQuake] = useState(null);
  const [venezuelaGeo, setVenezuelaGeo] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const center = [7.5, -66.5];

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/apache/superset/master/superset-frontend/plugins/legacy-plugin-chart-country-map/src/countries/venezuela.geojson')
      .then(r => r.json())
      .then(data => setVenezuelaGeo(data))
      .catch(err => console.error('Error cargando GeoJSON de Venezuela:', err));
  }, []);

  useEffect(() => {
    const requestLocation = async () => {
      try {
        const permissions = await Geolocation.checkPermissions();
        if (permissions.location !== 'granted') {
          const request = await Geolocation.requestPermissions();
          if (request.location !== 'granted') return;
        }
        const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
        setUserLocation([position.coords.latitude, position.coords.longitude]);
      } catch (err) {
        console.warn('Geolocalización no soportada o denegada:', err);
      }
    };
    requestLocation();
  }, []);

  const onEachState = (feature, layer) => {
    // Label for the state
    if (feature.properties && feature.properties.NAME_1) {
      layer.bindTooltip(
        feature.properties.NAME_1.toUpperCase(), 
        { permanent: true, direction: 'center', className: 'state-label-tooltip' }
      );
    }
  };

  const venezuelaStyle = {
    fillColor: '#1e293b',
    fillOpacity: 0.95,
    color: '#475569',
    weight: 1.5,
  };

  return (
    <div className="map-container">
      <MapContainer
        center={center}
        zoom={6}
        zoomControl={false}
        zoomSnap={0.1}
        zoomDelta={0.5}
        style={{ height: '100%', width: '100%', background: '#aadaff' }} // Premium Dark Vector Look
      >
        {venezuelaGeo && (
          <GeoJSON
            data={venezuelaGeo}
            style={venezuelaStyle}
            onEachFeature={onEachState}
          />
        )}

        {/* City Markers */}
        {CITIES.map((city, idx) => (
          <Marker 
            key={idx} 
            position={city.coords} 
            interactive={false}
            icon={L.divIcon({
              className: 'city-marker',
              html: `<div class="city-dot"></div><div class="city-name">${city.name}</div>`,
              iconSize: [100, 20],
              iconAnchor: [50, 10]
            })} 
          />
        ))}

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
            <Tooltip permanent direction="top" offset={[0, -10]}>Estás Aquí</Tooltip>
          </Marker>
        )}

        {earthquakes.map((quake, index) => {
          const { id, properties, geometry } = quake;
          const [lng, lat] = geometry.coordinates;
          const mag = properties.mag;
          const rank = earthquakes.length - index;
          return (
            <Marker
              key={id}
              position={[lat, lng]}
              icon={createPulseIcon(mag, rank)}
              eventHandlers={{ 
                click: () => setSelectedQuake(quake),
                mouseover: () => setSelectedQuake(quake),
                mouseout: () => setSelectedQuake(null)
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1} className="quake-tooltip">
                <strong>#{rank} · M {mag?.toFixed(1)}</strong> — {properties.place}
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Popups... */}
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
                <div className="popup-detail-row" style={{ marginTop: '6px', background: 'rgba(255,255,255,0.06)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <MapIcon size={16} style={{ color, flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>{getRegionInfo(properties.place)}</span>
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
