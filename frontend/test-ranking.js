const apiKey = "5ae2e3f221c38a28845f05b637d99595f9c491295fcfa2c2a047d7c6";

async function fetchBbox(sLat, nLat, wLon, eLon) {
  const url = `https://api.opentripmap.com/0.1/en/places/bbox?lon_min=${wLon}&lat_min=${sLat}&lon_max=${eLon}&lat_max=${nLat}&kinds=interesting_places&limit=100&apikey=${apiKey}`;
  console.log(url);
  const res = await fetch(url);
  const data = await res.json();
  console.log(data);
  return data.features || [];
}

async function testKarnataka() {
  console.log("=== Karnataka ===");
  // Approx Karnataka bbox
  const sLat = 11.5833, nLat = 18.45, wLon = 74.0833, eLon = 78.5833;
  let features = await fetchBbox(sLat, nLat, wLon, eLon);
}

testKarnataka();
