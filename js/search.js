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
    const q = input.value.trim().toLowerCase();

    if (q.length < 2) {
      resultsWrap.style.display = 'none';
      return;
    }

    resultsWrap.style.display = 'block';

    // Search routes by name
    const routeMatches = DU_ROUTES.filter(r =>
      r.nameEn.toLowerCase().includes(q) || r.nameBn.includes(q)
    );

    // Search routes by stop name
    const stopMatches = [];
    DU_ROUTES.forEach(r => {
      const matchingStops = r.stops.filter(s => s.toLowerCase().includes(q));
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
          <p>Try searching for a stop name (e.g. "Mirpur") or a route (e.g. "Khonika")</p>
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

    const stopCountInfo = `${route.stops.length} stops`;
    const tripChips = upcoming.length > 0
      ? upcoming.map(t => `
          <span class="trip-chip ${t.dir}">
            ${t.dir === 'up' ? '↑' : '↓'} ${t.time}${t.busNo ? ` · #${t.busNo}` : ''}
          </span>
        `).join('')
      : '<span style="color:var(--text-dim);font-size:0.8rem">No more trips today</span>';

    return `
      <div class="result-card">
        <div class="result-card-header">
          <div>
            <div class="result-route-name">${route.nameEn}</div>
            <div class="result-route-bn">${route.nameBn}</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <span style="font-size:0.78rem;color:var(--text-muted)">${stopCountInfo}</span>
            <a href="${route.fbGroup}" target="_blank" rel="noopener"
               class="btn btn-ghost btn-sm" style="font-size:0.75rem;padding:5px 10px">
              FB Group ↗
            </a>
          </div>
        </div>
        ${stopBadges ? `<div style="margin-bottom:10px">${stopBadges}</div>` : ''}
        <div class="result-next-trips">
          <strong>Upcoming trips:</strong>
          <div class="result-trips-row">${tripChips}</div>
        </div>
      </div>
    `;
  }
});
