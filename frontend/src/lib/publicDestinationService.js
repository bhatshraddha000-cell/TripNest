const detailsCache = new Map();

// Helper to strip HTML from strings if needed
function stripHtml(html) {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function getWeatherCondition(code) {
  if (code === 0) return 'Clear sky';
  if (code >= 1 && code <= 3) return 'Partly cloudy';
  if (code >= 45 && code <= 48) return 'Fog';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 65) return 'Rain';
  if (code >= 71 && code <= 75) return 'Snow';
  if (code >= 95) return 'Thunderstorm';
  return 'Clear';
}

// Track ongoing requests for cancellation
let currentAbortController = null;

export const publicDestinationService = {
  /**
   * getRandomDestinations is used for the landing page grid.
   * We will use a predefined safe list here to ensure the landing page always loads quickly.
   */
  async getRandomDestinations(count = 8) {
    const popular = [
      { name: 'Paris', country: 'France', description: 'The city of light.', imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e907600702e?auto=format&fit=crop&q=80&w=1000', rating: '4.8' },
      { name: 'Bali', country: 'Indonesia', description: 'Tropical paradise.', imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=1000', rating: '4.9' },
      { name: 'Tokyo', country: 'Japan', description: 'A bustling metropolis.', imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=1000', rating: '4.9' },
      { name: 'Santorini', country: 'Greece', description: 'Stunning sunsets.', imageUrl: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?auto=format&fit=crop&q=80&w=1000', rating: '4.8' },
      { name: 'New York', country: 'USA', description: 'The big apple.', imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=1000', rating: '4.7' },
      { name: 'Dubai', country: 'UAE', description: 'Modern luxury.', imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=1000', rating: '4.6' },
      { name: 'Rome', country: 'Italy', description: 'Ancient history.', imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=1000', rating: '4.8' },
      { name: 'Kyoto', country: 'Japan', description: 'Historic temples.', imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=1000', rating: '4.8' },
      { name: 'London', country: 'UK', description: 'Historic capital.', imageUrl: 'https://images.unsplash.com/photo-1513635269975-59693e0cd156?auto=format&fit=crop&q=80&w=1000', rating: '4.7' }
    ];
    return [...popular].sort(() => 0.5 - Math.random()).slice(0, count);
  },

  async getDestinationDetails(destinationName, signal) {
    if (!destinationName) throw new Error("Destination name is required");

    const cacheKey = destinationName.toLowerCase();
    
    // Check cache (valid for 15 minutes)
    if (detailsCache.has(cacheKey)) {
      const cached = detailsCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 15 * 60 * 1000) {
        return { ...cached.data, debug: { ...cached.data.debug, cache: 'HIT' } };
      }
    }

    // Normalized PublicDestination model
    const details = {
      name: destinationName,
      country: null,
      region: null,
      latitude: null,
      longitude: null,
      heroImage: null,
      gallery: [],
      overview: null,
      weather: null,
      topAttractions: [],
      wikipediaLink: null,
      
      // Tracking sources for the debug panel
      debug: {
        cache: 'MISS',
        sources: {
          coordinates: 'None',
          weather: 'None',
          description: 'None',
          image: 'None',
          attractions: 'None'
        }
      }
    };

    try {
      // 1. OpenStreetMap Nominatim for Geocoding
      const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destinationName)}&format=json&limit=1`, {
        signal,
        headers: { 'User-Agent': 'TripNest/1.0' }
      });
      const nomData = await nomRes.json();
      
      if (nomData && nomData.length > 0) {
        details.latitude = parseFloat(nomData[0].lat);
        details.longitude = parseFloat(nomData[0].lon);
        
        // Parse display_name "City, Region, Country"
        const parts = nomData[0].display_name.split(',').map(p => p.trim());
        if (parts.length >= 3) {
          details.country = parts[parts.length - 1];
          details.region = parts[parts.length - 2];
        } else if (parts.length >= 2) {
          details.country = parts[parts.length - 1];
        }
        details.debug.sources.coordinates = 'Nominatim';
      } else {
        throw new Error("Destination coordinates could not be resolved.");
      }

      // Execute subsequent APIs concurrently using the coordinates
      const promises = [];

      // 2. Wikipedia for Overview & Hero Image
      promises.push(
        fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(destinationName)}`, { signal })
          .then(res => res.json())
          .then(wikiData => {
            if (wikiData.extract) {
              details.overview = wikiData.extract;
              details.debug.sources.description = 'Wikipedia';
              details.wikipediaLink = wikiData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(destinationName)}`;
            }
            if (wikiData.originalimage?.source) {
              details.heroImage = wikiData.originalimage.source;
              details.gallery.push(wikiData.originalimage.source);
              details.debug.sources.image = 'Wikipedia';
            }
          })
          .catch(() => console.warn('Wikipedia API failed'))
      );

      // 3. Open-Meteo for Weather
      if (details.latitude && details.longitude) {
        promises.push(
          fetch(`https://api.open-meteo.com/v1/forecast?latitude=${details.latitude}&longitude=${details.longitude}&current_weather=true&hourly=relativehumidity_2m,apparent_temperature`, { signal })
            .then(res => res.json())
            .then(weatherData => {
              if (weatherData.current_weather) {
                const current = weatherData.current_weather;
                const hourly = weatherData.hourly;
                const hourIndex = hourly?.time?.findIndex(t => t.startsWith(current.time)) || 0;
                const safeIndex = hourIndex > -1 ? hourIndex : 0;
                
                details.weather = {
                  temperature: current.temperature,
                  condition: getWeatherCondition(current.weathercode),
                  wind: `${current.windspeed} km/h`,
                  humidity: hourly?.relativehumidity_2m?.[safeIndex] ? `${hourly.relativehumidity_2m[safeIndex]}%` : 'N/A',
                  feelsLike: hourly?.apparent_temperature?.[safeIndex] ? `${hourly.apparent_temperature[safeIndex]}°C` : `${current.temperature}°C`,
                  localTime: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                };
                details.debug.sources.weather = 'Open-Meteo';
              }
            })
            .catch(() => console.warn('Open-Meteo API failed'))
        );

        // 4. Wikipedia GeoSearch for Attractions
        promises.push(
          fetch(`https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${details.latitude}|${details.longitude}&gsradius=10000&gslimit=8&format=json&origin=*`, { signal })
            .then(res => res.json())
            .then(async (geoData) => {
              const places = geoData?.query?.geosearch || [];
              if (places.length > 0) {
                details.debug.sources.attractions = 'WikiGeoSearch';
                
                // Fetch details for top 5 places to avoid overwhelming the API
                const detailedPlaces = places.slice(0, 5).filter(p => p.title !== destinationName);
                
                const placePromises = detailedPlaces.map(place => 
                  fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(place.title)}`, { signal })
                    .then(r => r.json())
                    .then(summary => ({
                      id: place.pageid,
                      name: place.title,
                      description: summary.extract || 'Historical/cultural landmark.',
                      category: 'Landmark',
                      image: summary.thumbnail?.source || summary.originalimage?.source || null,
                      lat: place.lat,
                      lon: place.lon
                    }))
                    .catch(() => null)
                );
                
                const resolvedPlaces = await Promise.all(placePromises);
                details.topAttractions = resolvedPlaces.filter(p => p !== null);
                
                // Add valid images to gallery
                details.topAttractions.forEach(attr => {
                  if (attr.image && !details.gallery.includes(attr.image)) {
                    details.gallery.push(attr.image);
                  }
                });
              }
            })
            .catch(() => console.warn('Wiki GeoSearch API failed'))
        );
      }

      await Promise.all(promises);

      // Save to cache on success
      detailsCache.set(cacheKey, { timestamp: Date.now(), data: details });
      
      return details;
      
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log(`[Service] Request aborted for ${destinationName}`);
        throw err;
      }
      console.error('[Service] Critical failure fetching destination details:', err);
      // Return details object with whatever successfully resolved before failure
      return details;
    }
  }
}
