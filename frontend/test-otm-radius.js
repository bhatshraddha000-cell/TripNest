const apiKey = "5ae2e3f221c38a28845f05b637d99595f9c491295fcfa2c2a047d7c6";
async function testRadius() {
  const url = `https://api.opentripmap.com/0.1/en/places/radius?radius=100000&lon=75.7139&lat=15.3173&kinds=interesting_places&limit=50&apikey=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  console.log(data);
}
testRadius();
