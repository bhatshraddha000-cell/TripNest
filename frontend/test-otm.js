const apiKey = "5ae2e3f221c38a28845f05b637d99595f9c491295fcfa2c2a047d7c6"; // API key from java code
async function testOTM() {
  const lat = 15.3173; // Karnataka approx
  const lon = 75.7139;
  const radius = 300000;
  const url = `https://api.opentripmap.com/0.1/en/places/radius?radius=${radius}&lon=${lon}&lat=${lat}&rate=3&kinds=interesting_places&limit=50&apikey=${apiKey}`;
  
  const res = await fetch(url);
  const data = await res.json();
  
  const features = data.features || [];
  console.log(`Found ${features.length} attractions`);
  
  // Sort by rate
  features.sort((a, b) => b.properties.rate - a.properties.rate);
  
  features.slice(0, 10).forEach(f => {
    console.log(`${f.properties.name} - Rate: ${f.properties.rate} - Kinds: ${f.properties.kinds}`);
  });
}
testOTM();
