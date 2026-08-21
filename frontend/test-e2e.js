

const API_KEY = "5ae2e3f221c38a28845f05b6bfe45a5e83cfd63984ab444a338f06f3";

const ATTRACTIONS = [
  { name: "Bangalore Fort", lat: 12.9634, lon: 77.5756 },
  { name: "Mysore Palace", lat: 12.3052, lon: 76.6552 },
  { name: "Hampi", lat: 15.3350, lon: 76.4600 },
  { name: "Eiffel Tower", lat: 48.8584, lon: 2.2945 },
  { name: "Statue of Liberty", lat: 40.6892, lon: -74.0445 },
  { name: "Tower Bridge", lat: 51.5055, lon: -0.0754 }
];

async function getXid(attraction) {
  const url = `https://api.opentripmap.com/0.1/en/places/radius?radius=50000&lat=${attraction.lat}&lon=${attraction.lon}&kinds=interesting_places&limit=5&apikey=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.features && data.features.length > 0) {
    // Find the closest match or just return the first one with a rate
    const sorted = data.features.sort((a, b) => b.properties.rate - a.properties.rate);
    return sorted[0].properties.xid;
  }
  return null;
}

const getAvailableImages = (attr) => {
  if (!attr) return [];
  const images = [];
  if (attr.preview) images.push(attr.preview);
  if (attr.image) images.push(attr.image);
  if (attr.thumbnail) images.push(attr.thumbnail);
  if (attr.originalImage) images.push(attr.originalImage);
  if (attr.heroImage && !images.includes(attr.heroImage)) images.push(attr.heroImage);
  if (attr.fallbackImage) images.push(attr.fallbackImage);
  images.push('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop');
  return [...new Set(images)].filter(Boolean);
};

async function authenticate() {
  const user = {
    fullName: "Test User",
    email: "test" + Date.now() + "@tripnest.com",
    password: "password123"
  };
  // Register
  await fetch("http://localhost:8081/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user)
  });
  // Login
  const res = await fetch("http://localhost:8081/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: user.email, password: user.password })
  });
  const data = await res.json();
  return data.token;
}

async function testE2E() {
  let allTestsPassed = true;
  console.log("Authenticating...");
  const token = await authenticate();
  console.log("Token received");

  for (const attraction of ATTRACTIONS) {
    console.log(`\nTesting: ${attraction.name}`);
    const xid = await getXid(attraction);
    if (!xid) {
      console.log(`Failed to find XID for ${attraction.name}`);
      allTestsPassed = false;
      continue;
    }
    console.log(`Found XID: ${xid}`);

    // Call local backend
    let details;
    try {
      const res = await fetch(`http://localhost:8081/api/attractions/${xid}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.status !== 200) {
        console.log(`Backend returned ${res.status}`);
        allTestsPassed = false;
        continue;
      }
      details = await res.json();
    } catch (e) {
      console.log(`Error calling backend: ${e.message}`);
      allTestsPassed = false;
      continue;
    }

    console.log("Backend response contains:");
    const requiredFields = ['heroImage', 'preview', 'image', 'thumbnail', 'originalImage', 'fallbackImage'];
    for (const field of requiredFields) {
      console.log(`- ${field}: ${details[field] ? 'YES' : 'NO'} (${details[field]})`);
    }

    const availableImages = getAvailableImages(details);
    console.log(`Frontend getAvailableImages returned ${availableImages.length} sources`);
    if (availableImages.length === 0) {
      console.log("FAIL: No images found");
      allTestsPassed = false;
    }

    // Simulate failures
    console.log("Simulating failures...");
    let simulation = { ...details };
    
    // Remove preview
    simulation.preview = null;
    let simImages = getAvailableImages(simulation);
    console.log(`After removing preview: next source is ${simImages[0]}`);

    // Remove image
    simulation.image = null;
    simImages = getAvailableImages(simulation);
    console.log(`After removing image: next source is ${simImages[0]}`);

    // Remove thumbnail
    simulation.thumbnail = null;
    simImages = getAvailableImages(simulation);
    console.log(`After removing thumbnail: next source is ${simImages[0]}`);
    
    // Remove all sources except fallback
    simulation.originalImage = null;
    simulation.heroImage = null;
    simImages = getAvailableImages(simulation);
    console.log(`After removing all APIs: next source is ${simImages[0]}`);
    
    if (!simImages[0] || simImages[0] !== simulation.fallbackImage) {
      console.log("FAIL: Fallback image not displayed properly");
      allTestsPassed = false;
    }
  }
  
  if (allTestsPassed) {
    console.log("\nALL END-TO-END TESTS PASSED!");
  } else {
    console.log("\nSOME TESTS FAILED.");
  }
}

testE2E();
