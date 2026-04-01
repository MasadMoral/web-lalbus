// Search Page JS

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('searchInput');
  const resultsWrap = document.getElementById('searchResults');
  const resultsInner = document.getElementById('resultsInner');
  const countLabel = document.getElementById('resultsCount');

  let debounce;

  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(doSearch, 180);
  });

  function doSearch() {
    let q = input.value.trim().toLowerCase();

    if (q.length < 2) {
      resultsWrap.style.display = 'none';
      return;
    }

    resultsWrap.style.display = 'block';

    // Search routes by name (case-insensitive for safety, though primarily Bangla)
    const routeMatches = DU_ROUTES.filter(r =>
      r.nameEn.toLowerCase().includes(q) || r.nameBn.toLowerCase().includes(q)
    );

    // Search routes by stop name
    const stopMatches = [];
    DU_ROUTES.forEach(r => {
      const matchingStops = r.stops.filter(s => 
        s.toLowerCase().includes(q)
      );
      if (matchingStops.length && !routeMatches.includes(r)) {
        stopMatches.push({ route: r, matchingStops });
      }
    });

    const totalResults = routeMatches.length + stopMatches.length;
    countLabel.textContent = `${totalResults} result${totalResults !== 1 ? 's' : ''} for "${input.value.trim()}"`;

    if (totalResults === 0) {
      resultsInner.innerHTML = `
        <div class="search-empty">
          <div class="big">🔍</div>
          <h3>No results found</h3>
          <p>Try searching for a stop name (e.g. "Mirpur") or a route (e.g. "Choitali")</p>
        </div>`;
      return;
    }

    let html = '';

    // Route name matches
    routeMatches.forEach(r => {
      const upcoming = getUpcomingTrips(r.schedule, 4);
      html += renderResultCard(r, null, upcoming);
    });

    // Stop matches
    stopMatches.forEach(({ route, matchingStops }) => {
      const upcoming = getUpcomingTrips(route.schedule, 4);
      html += renderResultCard(route, matchingStops, upcoming);
    });

    resultsInner.innerHTML = html;
  }

  function renderResultCard(route, matchingStops, upcoming) {
    const stopBadges = matchingStops
      ? matchingStops.map(s => `<span class="result-matching-stop">📍 ${s}</span>`).join(' ')
      : '';

    const stopCountInfo = `🚌 ${route.stops.length} stops`;
    const tripChips = upcoming.length > 0
      ? upcoming.map(t => `
          <span class="trip-chip ${t.dir}" title="${t.dir === 'up' ? 'To Campus' : 'From Campus'}">
            ${t.dir === 'up' ? '↑' : '↓'} ${t.time}${t.busNo ? ` · #${t.busNo}` : ''}
          </span>
        `).join('')
      : '<span style="color:var(--text-dim);font-size:0.8rem">No more trips today</span>';

    return `
      <div class="result-card" onclick="location.href='schedule.html?route=${route.id}'" style="cursor:pointer">
        <div class="result-card-header">
          <div style="display:flex; align-items:center; gap:12px">
            <div class="route-icon-circle">🚌</div>
            <div>
              <div class="result-route-name">${route.nameEn}</div>
              <div class="result-route-bn">${route.nameBn}</div>
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:4px">${stopCountInfo}</div>
            <a href="${route.fbGroup}" target="_blank" rel="noopener"
               class="btn btn-ghost btn-sm" style="font-size:0.7rem;padding:3px 8px; border-radius:4px" 
               onclick="event.stopPropagation()">
              FB Group ↗
            </a>
          </div>
        </div>
        ${stopBadges ? `<div style="margin-top:8px; display:flex; flex-wrap:wrap; gap:6px">${stopBadges}</div>` : ''}
        <div class="result-next-trips" style="margin-top:12px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.05)">
          <div style="display:flex; justify-content:space-between; align-items:center">
            <strong style="font-size:0.82rem; color:var(--text-muted)">Upcoming Trips</strong>
            <span style="font-size:0.75rem; color:var(--accent)">View full schedule →</span>
          </div>
          <div class="result-trips-row" style="margin-top:8px">${tripChips}</div>
        </div>
      </div>
    `;
  }
});
