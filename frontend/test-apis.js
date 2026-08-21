async function testApis() {
  const city = 'Santorini';
  
  // 1. Nominatim
  const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${city}&format=json&limit=1`, {
    headers: { 'User-Agent': 'TripNest/1.0' }
  });
  const nomData = await nomRes.json();
  console.log('Nominatim:', nomData[0]?.lat, nomData[0]?.lon);
  
  if (nomData[0]) {
    const lat = nomData[0].lat;
    const lon = nomData[0].lon;
    
    // 2. Wiki Geosearch
    const geoRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lon}&gsradius=10000&gslimit=5&format=json&origin=*`);
    const geoData = await geoRes.json();
    console.log('Wiki Geosearch:', geoData.query.geosearch);
  }
}
testApis();
