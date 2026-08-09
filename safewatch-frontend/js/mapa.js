let mapa = null;
let marcador = null;
let watchId = null;

function initMapa() {
    const mapEl = document.getElementById('mapa');
    if (!mapEl) {
        setTimeout(initMapa, 1000);
        return;
    }

    if (!navigator.geolocation) {
        const dirEl = document.getElementById('direccionActual');
        if (dirEl) dirEl.textContent = '⚠️ Geolocalización no soportada';
        return;
    }

    mapa = L.map('mapa').setView([-12.0464, -77.0428], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19
    }).addTo(mapa);

    const iconoPersona = L.divIcon({
        html: '<div style="background:#00e6a0;width:28px;height:28px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 15px rgba(0,230,160,0.8);animation:pulse-marker 2s infinite;"></div>',
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
    });

    watchId = navigator.geolocation.watchPosition(
        function(posicion) {
            const lat = posicion.coords.latitude;
            const lon = posicion.coords.longitude;
            const precision = posicion.coords.accuracy;

            const latEl = document.getElementById('latActual');
            const lonEl = document.getElementById('lonActual');
            const dirEl = document.getElementById('direccionActual');

            if (latEl) latEl.textContent = lat.toFixed(6);
            if (lonEl) lonEl.textContent = lon.toFixed(6);

            if (!marcador) {
                marcador = L.marker([lat, lon], { icon: iconoPersona }).addTo(mapa);
            } else {
                marcador.setLatLng([lat, lon]);
            }

            mapa.setView([lat, lon], mapa.getZoom());
            window.ultimaUbicacion = { lat, lon, precision };

            // OBTENER DIRECCIÓN REAL (CALLE)
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=es&zoom=18`)
                .then(r => r.json())
                .then(data => {
                    if (data && data.display_name) {
                        const direccionCorta = data.display_name.split(',').slice(0, 3).join(',');
                        if (dirEl) dirEl.innerHTML = '<i class="fas fa-map-pin"></i> ' + direccionCorta;
                    }
                })
                .catch(() => {
                    if (dirEl) dirEl.innerHTML = '<i class="fas fa-satellite"></i> Precisión: ±' + Math.round(precision) + 'm';
                });
        },
        function(error) {
            const dirEl = document.getElementById('direccionActual');
            if (dirEl) dirEl.textContent = '❌ Error al obtener ubicación';
        },
        {
            enableHighAccuracy: true,
            maximumAge: 1000,
            timeout: 10000
        }
    );

    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse-marker {
            0%, 100% { box-shadow: 0 0 0 0 rgba(0, 230, 160, 0.8); }
            50% { box-shadow: 0 0 0 20px rgba(0, 230, 160, 0); }
        }
        #mapa { z-index: 1 !important; }
    `;
    document.head.appendChild(style);
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initMapa, 1500);
});