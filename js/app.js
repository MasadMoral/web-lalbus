// DU Lal Bus — Shared App JS

// ---- Active nav link ----
document.addEventListener('DOMContentLoaded', () => {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  // Mobile nav toggle
  const btn = document.getElementById('navMobileBtn');
  const links = document.querySelector('.nav-links');
  if (btn && links) {
    btn.addEventListener('click', () => {
      links.classList.toggle('open');
      btn.textContent = links.classList.contains('open') ? '✕' : '☰';
    });
    // Close on link click
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        links.classList.remove('open');
        btn.textContent = '☰';
      });
    });
  }
});

// ---- Utility: next N trips from now ----
function getUpcomingTrips(schedule, n = 5) {
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();

  function toMinutes(timeStr) {
    if (!timeStr || !timeStr.includes(' ')) return -1;
    const [time, period] = timeStr.split(' ');
    if (!time.includes(':')) return -1;
    let [h, m] = time.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return -1;
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }

  const future = schedule.filter(t => {
    const mins = toMinutes(t.time);
    return mins >= current;
  });
  return future.slice(0, n);
}

// ---- Utility: all stops across all routes (unique) ----
function getAllStops() {
  const set = new Set();
  DU_ROUTES.forEach(r => r.stops.forEach(s => set.add(s)));
  return [...set].sort();
}

// ---- Utility: routes serving a stop ----
function getRoutesForStop(stopName) {
  return DU_ROUTES.filter(r => r.stops.includes(stopName));
}

// ---- Scroll fade-in observer ----
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('fade-up');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
