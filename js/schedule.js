// Schedule Page JS

document.addEventListener('DOMContentLoaded', () => {
  const routeSelect = document.getElementById('routeSelect');
  const dirSelect = document.getElementById('dirSelect');
  const tbody = document.getElementById('scheduleBody');
  const countLabel = document.getElementById('tripCount');

  // Populate route dropdown
  DU_ROUTES.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = `${r.nameEn} (${r.nameBn})`;
    routeSelect.appendChild(opt);
  });

  function render() {
    const routeId = routeSelect.value;
    const dir = dirSelect.value;

    let rows = [];
    const routes = routeId === 'all' ? DU_ROUTES : DU_ROUTES.filter(r => r.id === routeId);

    routes.forEach(route => {
      route.schedule.forEach(trip => {
        if (dir === 'all' || trip.dir === dir) {
          rows.push({ route, trip });
        }
      });
    });

    countLabel.textContent = `${rows.length} trip${rows.length !== 1 ? 's' : ''}`;

    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="no-data">No trips match your filters.</td></tr>`;
      return;
    }

    tbody.innerHTML = rows.map(({ route, trip }) => `
      <tr>
        <td>
          <span style="font-weight:600">${route.nameEn}</span>
          <span style="display:block;font-size:0.8rem;color:var(--text-muted);font-family:'Noto Sans Bengali',sans-serif">${route.nameBn}</span>
        </td>
        <td style="font-weight:600;color:var(--text)">${trip.time}</td>
        <td>
          <span class="badge-dir ${trip.dir === 'up' ? 'badge-up' : 'badge-down'}">
            ${trip.dir === 'up' ? '↑ To Campus' : '↓ From Campus'}
          </span>
        </td>
        <td>${trip.busNo ? `<span class="bus-no">#${trip.busNo}</span>` : '<span style="color:var(--text-dim)">—</span>'}</td>
        <td>${trip.busType ? `<span style="font-size:0.82rem;color:var(--text-muted)">${trip.busType}</span>` : '<span style="color:var(--text-dim)">—</span>'}</td>
      </tr>
    `).join('');
  }

  routeSelect.addEventListener('change', render);
  dirSelect.addEventListener('change', render);
  render();
});
