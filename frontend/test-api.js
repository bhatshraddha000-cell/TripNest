async function testCity(city) {
  try {
    const url = `http://localhost:8081/api/public/destinations/${city}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`Failed for ${city}: ${res.status}`);
      return;
    }
    const data = await res.json();
    console.log(`\n=== Top 10 for ${city} ===`);
    if (!data.topAttractions || data.topAttractions.length === 0) {
      console.log("No attractions found.");
      return;
    }
    data.topAttractions.slice(0, 10).forEach((a, i) => {
      console.log(`${i+1}. ${a.name} (${a.kind}) - Rating: ${a.rating}`);
    });
  } catch(e) {
    console.log(`Error testing ${city}:`, e.message);
  }
}

async function run() {
  await testCity("Karnataka");
  await testCity("Kerala");
  await testCity("Paris");
  await testCity("New York");
  await testCity("Tokyo");
  process.exit(0);
}

run();
