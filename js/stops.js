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

  // Dark tile layer from CartoDB
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    subdomains: 'abcd', maxZoom: 19
  }).addTo(map);

  // Custom red marker icon
  const redIcon = L.divIcon({
    className: '',
    html: `<div style="
      width:12px;height:12px;
      background:#e53e3e;
      border:2px solid rgba(229,62,62,0.4);
      border-radius:50%;
      box-shadow:0 0 0 3px rgba(229,62,62,0.18),0 2px 6px rgba(0,0,0,0.5);
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -10],
  });

  // Large icon for DU Campus
  const duIcon = L.divIcon({
    className: '',
    html: `<div style="
      width:18px;height:18px;
      background:#e53e3e;
      border:3px solid rgba(229,62,62,0.5);
      border-radius:50%;
      box-shadow:0 0 0 5px rgba(229,62,62,0.2),0 2px 10px rgba(0,0,0,0.6);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -12],
  });

  let markers = [];
  let activeFilter = 'all';

  // Build stop → routes index
  const stopRoutes = {};
  DU_ROUTES.forEach(route => {
    route.stops.forEach(stop => {
      if (!stopRoutes[stop]) stopRoutes[stop] = [];
      stopRoutes[stop].push(route);
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
            ? `<div style="margin-bottom:6px;color:#8a8fa8;font-size:0.75rem">${routes.length} route${routes.length !== 1 ? 's' : ''}</div>${routeTags}`
            : '<span style="color:#4a4f6a;font-size:0.78rem">No route data</span>'
          }
        </div>
      </div>
    `;

    const marker = L.marker([lat, lng], { icon })
      .addTo(map)
      .bindPopup(popup, { maxWidth: 260 });

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

    routeFilter.addEventListener('change', () => {
      const val = routeFilter.value;
      markers.forEach(({ marker, routes }) => {
        if (val === 'all') {
          marker.addTo(map);
        } else {
          const hasRoute = routes.some(r => r.id === val);
          if (hasRoute) marker.addTo(map);
          else map.removeLayer(marker);
        }
      });

      // Fit bounds to visible markers if filtering
      if (val !== 'all') {
        const route = DU_ROUTES.find(r => r.id === val);
        if (route) {
          const coords = route.stops
            .map(s => STOP_COORDS[s])
            .filter(Boolean);
          if (coords.length) map.fitBounds(coords, { padding: [40, 40] });
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
