// Map feature is temporarily disabled for development
document.addEventListener('DOMContentLoaded', () => {
    console.log('Map feature is currently under development.');
    
    // Minimal logic to keep the page from breaking if other scripts depend on it
    const routeFilter = document.getElementById('routeFilter');
    if (routeFilter && typeof DU_ROUTES !== 'undefined') {
        DU_ROUTES.forEach(route => {
            const opt = document.createElement('option');
            opt.value = route.id;
            opt.textContent = route.nameBn || route.nameEn;
            routeFilter.appendChild(opt);
        });
    }
});
