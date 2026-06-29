export const fetchEarthquakes = async () => {
  // Bounding box for Venezuela (approximate)
  const minLat = 0.5;
  const maxLat = 12.5;
  const minLng = -73.5;
  const maxLng = -59.5;
  
  // Fecha del terremoto: 24 de junio de 2026
  const startTime = '2026-06-24T00:00:00Z';
  
  // Pedimos desde 4.0 para el conteo y las alertas
  const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=${minLat}&maxlatitude=${maxLat}&minlongitude=${minLng}&maxlongitude=${maxLng}&starttime=${startTime}&minmagnitude=4.0&orderby=time&limit=500`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Error fetching seismic data');
    }
    const data = await response.json();
    const features = data.features || [];
    
    // Filtrar estrictamente aquellos cuyo lugar ('place') incluya 'Venezuela'
    const venezuelaOnly = features.filter(quake => {
      const place = quake.properties.place;
      return place && place.toLowerCase().includes('venezuela');
    });

    return venezuelaOnly;
  } catch (error) {
    console.error("Error fetching earthquake data:", error);
    return [];
  }
};
