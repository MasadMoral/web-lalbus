// Stops Map Page JS — Leaflet.js

document.addEventListener('DOMContentLoaded', () => {
  // Init map centred on DU
  const map = L.map('map', {
    center: [23.7281, 90.3969],
    zoom: 13,
    zoomControl: false,
  });

  // Add zoom control top-right
  L.control.zoom({ position: 'topright' }).addTo(map);

  // Light tile layer from CartoDB (Voyager)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    subdomains: 'abcd', maxZoom: 19
  }).addTo(map);

  // Stop Name Mapping (Bengali in routes.js -> English in stops.js)
  const STOP_NAME_MAP = {
    'মিরপুর': 'Mirpur-10',
    'মহাখালী': 'Mohakhali',
    'টিএসসি': 'TSC',
    'টি এস সি': 'TSC',
    'তি এস সি': 'TSC',
    'যাত্রাবাড়ী': 'Jatrabari',
    'বাড্ডা': 'Middle Badda',
    'কার্জন হল': 'Curzon Hall',
    'কলা ভবন': 'Kala Bhaban',
    'রোকেয়া হল': 'Rokeya Hall',
    'কুয়েত মৈত্রী হল': 'Kuwait Moitri Hall',
    'মল চত্বর': 'DU Campus',
    'মলচত্বর': 'DU Campus',
    'ভিসি চত্বর': 'DU Campus',
    'বিশ্বরোড': 'Kuril Bishwaroad',
    'এয়ারপোর্ট': 'Airport',
    'আব্দুল্লাপুর': 'Abdullahpur',
    'চিটাগাং রোড': 'Chittagong Road',
    'রামপুরা টিভি সেন্টার': 'Rampura TV Center',
    'রামপুরা বাজার': 'Rampura Bazar',
    'মালিবাগ': 'Malibag Mor',
    'ফার্মগেট': 'Pharmgate', // I should check if Pharmgate is in STOP_COORDS
    'শাহবাগ': 'Shahbag',
    'আজিমপুর': 'Azimpur',
    'নীলক্ষেত': 'Nilkhet',
    'খড়কি': 'Khorka', // check?
    'মাওয়া ঘাট': 'Mawa Ghat',
    'মোহাম্মদপুর': 'Mohammadpur Bus Stand',
    'শংকর': 'Shankar',
    'ধানমন্ডি ১৫ (কাকলী)': 'Dhanmondi-15',
    'ধানমন্ডি ১৫': 'Dhanmondi-15',
    'শনির আখড়া': 'Shonir Akhra',
    'চিটাগাংরোড': 'Chittagong Road',
    'চিটাগাং রোড': 'Chittagong Road',
    'চিটাগাং রোড়': 'Chittagong Road',
    'নতুনবাজার': 'Notun Bazar',
    'লিংক রোড': 'Middle Badda', // Approximate
  };

  function getStopCoord(name) {
    if (!name) return null;
    const cleanName = name.trim();
    if (STOP_COORDS[cleanName]) return STOP_COORDS[cleanName];
    
    // Check mapped names
    const mapped = STOP_NAME_MAP[cleanName];
    if (mapped && STOP_COORDS[mapped]) return STOP_COORDS[mapped];

    // Fuzzy match: check if STOP_COORDS has a key that is a substring or vice versa
    const coordKeys = Object.keys(STOP_COORDS);
    
    // 1. Exact substring match (cleanName contains key or vice versa)
    for (const key of coordKeys) {
      if (cleanName.includes(key) || key.includes(cleanName)) {
        return STOP_COORDS[key];
      }
    }

    // 2. Map known recurring substrings
    if (cleanName.includes('টিএসসি') || cleanName.includes('টি এস সি') || cleanName.includes('TSC')) return STOP_COORDS['TSC'];
    if (cleanName.includes('কার্জন')) return STOP_COORDS['Curzon Hall'];
    if (cleanName.includes('কলা ভবন')) return STOP_COORDS['Kala Bhaban'];
    if (cleanName.includes('জিগাতলা')) return STOP_COORDS['Jigatola']; // or Jigatola's coordinates if it exists
    if (cleanName.includes('মিরপুর')) return STOP_COORDS['Mirpur-10'] || STOP_COORDS['মিরপুর'];
    if (cleanName.includes('সাভার')) return STOP_COORDS['Savar Stand'] || STOP_COORDS['সাভার'];
    if (cleanName.includes('মাওয়া')) return STOP_COORDS['Mawa Ghat'] || STOP_COORDS['মাওয়া'];

    return null;
  }

  let activePolyline = null;
  let activeArrows = [];

  function clearRouteLayer() {
    if (activePolyline) map.removeLayer(activePolyline);
    activeArrows.forEach(a => map.removeLayer(a));
    activeArrows = [];
  }

  async function drawRoute(route) {
    clearRouteLayer();
    const stops = route.stops
      .map(s => getStopCoord(s))
      .filter(Boolean);

    if (stops.length < 2) return;

    // Try OSRM for road-snapped path
    const coordinates = stops.map(s => `${s[1]},${s[0]}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;

    let coordsForArrows = stops;

    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.code === 'Ok' && data.routes.length > 0) {
        const roadCoords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
        activePolyline = L.polyline(roadCoords, {
          color: '#e53e3e',
          weight: 5,
          opacity: 0.8,
          lineJoin: 'round'
        }).addTo(map);
        coordsForArrows = roadCoords;
      } else {
        throw new Error('OSRM failed');
      }
    } catch (e) {
      console.warn('Falling back to straight lines:', e);
      activePolyline = L.polyline(stops, {
        color: '#e53e3e',
        weight: 4,
        opacity: 0.7,
        dashArray: '8, 8'
      }).addTo(map);
    }

    // Add arrow heads along the path (every 10th point for road-snapped, or every point for straight)
    const step = coordsForArrows.length > 20 ? Math.floor(coordsForArrows.length / 10) : 1;
    for (let i = 0; i < coordsForArrows.length - 1; i += step) {
        const from = coordsForArrows[i];
        const nextIdx = Math.min(i + Math.max(1, Math.floor(step/2)), coordsForArrows.length - 1);
        const to = coordsForArrows[nextIdx];
        
        const angle = Math.atan2(to[0] - from[0], to[1] - from[1]) * 180 / Math.PI;
        const mid = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
        
        const arrowMarker = L.marker(mid, {
            icon: L.divIcon({
                className: '',
                html: `<div style="transform: rotate(${angle - 90}deg); font-size:16px; color:#e53e3e; text-shadow:0 0 3px #fff;">▶</div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            }),
            interactive: false
        }).addTo(map);
        activeArrows.push(arrowMarker);
    }
  }

  // Large icon for DU Campus
  const duIcon = L.divIcon({
    className: '',
    html: `<div style="
      width:18px;height:18px;
      background:#e53e3e;
      border:3px solid #fff;
      border-radius:50%;
      box-shadow:0 2px 10px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -12],
  });

  const redIcon = L.divIcon({
    className: '',
    html: `<div style="
      width:12px;height:12px;
      background:#e53e3e;
      border:2px solid #fff;
      border-radius:50%;
      box-shadow:0 1px 6px rgba(0,0,0,0.2);
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -10],
  });

  let markers = [];

  // Build stop → routes index
  const stopRoutes = {};
  DU_ROUTES.forEach(route => {
    route.stops.forEach(stop => {
      const canonical = STOP_NAME_MAP[stop] || stop;
      if (!stopRoutes[canonical]) stopRoutes[canonical] = [];
      if (!stopRoutes[canonical].some(r => r.id === route.id)) {
        stopRoutes[canonical].push(route);
      }
    });
  });

  // Place markers
  Object.entries(STOP_COORDS).forEach(([name, [lat, lng]]) => {
    const routes = stopRoutes[name] || [];
    const icon = name === 'DU Campus' ? duIcon : redIcon;

    const routeTags = routes.map(r =>
      `<span class="popup-route-tag">${r.nameEn}</span>`
    ).join('');

    const popup = `
      <div style="min-width:160px;padding:4px">
        <div class="popup-name">📍 ${name}</div>
        <div class="popup-routes">
          ${routes.length > 0
            ? `<div style="margin-bottom:6px;color:#666;font-size:0.75rem">${routes.length} route${routes.length !== 1 ? 's' : ''}</div>${routeTags}`
            : '<span style="color:#999;font-size:0.78rem">No route data</span>'
          }
        </div>
      </div>
    `;

    const marker = L.marker([lat, lng], { icon })
      .addTo(map)
      .bindPopup(popup, { maxWidth: 260 })
      .bindTooltip(name, { 
        permanent: true, 
        direction: 'top', 
        offset: [0, -10],
        className: 'stop-tooltip'
      });

    markers.push({ marker, name, routes });
  });

  // Route filter
  const routeFilter = document.getElementById('routeFilter');
  if (routeFilter) {
    DU_ROUTES.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = r.nameEn;
      routeFilter.appendChild(opt);
    });

    routeFilter.addEventListener('change', async () => {
      const val = routeFilter.value;
      clearRouteLayer();

      markers.forEach(({ marker, routes }) => {
        const tooltip = marker.getTooltip();
        if (val === 'all') {
          marker.addTo(map);
          if (tooltip) {
            L.DomUtil.removeClass(tooltip._container, 'active-tooltip');
          }
        } else {
          const hasRoute = routes.some(r => r.id === val);
          if (hasRoute) {
            marker.addTo(map);
            if (tooltip) {
              L.DomUtil.addClass(tooltip._container, 'active-tooltip');
            }
          } else {
            map.removeLayer(marker);
            if (tooltip) {
              L.DomUtil.removeClass(tooltip._container, 'active-tooltip');
            }
          }
        }
      });

      if (val !== 'all') {
        const route = DU_ROUTES.find(r => r.id === val);
        if (route) {
          await drawRoute(route);
          const coords = route.stops
            .map(s => getStopCoord(s))
            .filter(Boolean);
          if (coords.length) map.fitBounds(coords, { padding: [60, 60] });
        }
      } else {
        map.setView([23.7281, 90.3969], 13);
      }
    });
  }

  // Update stop count
  const stopCount = document.getElementById('stopCount');
  if (stopCount) stopCount.textContent = Object.keys(STOP_COORDS).length;
});
