class MapManager {
    constructor(state) {
        this.state = state;
        this.map = null;
        this.markers = [];
        this.lightTileLayer = null;
        this.darkTileLayer = null;
    }

    initMap() {
        this.map = L.map('map').setView(CONFIG.DEFAULT_MAP_CENTER, CONFIG.DEFAULT_ZOOM);
        
        // Initialize both tile layers
        this.lightTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        });

        this.darkTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors, © CARTO'
        });

        // Set initial layer based on current theme
        const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
        (isDarkMode ? this.darkTileLayer : this.lightTileLayer).addTo(this.map);

        // Listen for theme changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
                    this.map.removeLayer(isDark ? this.lightTileLayer : this.darkTileLayer);
                    this.map.addLayer(isDark ? this.darkTileLayer : this.lightTileLayer);
                    // Update existing markers for new theme
                    this.updateMarkers();
                }
            });
        });

        observer.observe(document.documentElement, { attributes: true });
    }

    createNumberedIcon(number) {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        
        return L.divIcon({
            className: `custom-number-icon ${isDark ? 'dark' : 'light'}`,
            html: number,
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        });
    }

    updateMarkers() {
        // Clear existing markers
        this.markers.forEach(marker => marker.remove());
        this.markers = [];

        // Check if callList exists and has items
        if (!this.state.callList || !Array.isArray(this.state.callList)) {
            console.warn('No valid call list available');
            return;
        }

        // Add new markers
        this.state.callList.forEach(item => {
            if (item.lat && item.lon) {
                const marker = L.marker(
                    [item.lat, item.lon],
                    {icon: this.createNumberedIcon(item.rank), interactive: true}
                ).addTo(this.map);
                
                // Add popup with dark mode support
                const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
                const popupContent = `
                    <div class="map-popup ${isDark ? 'dark' : 'light'}">
                        <b>${item.bpNumber}</b><br>${item.address}
                    </div>
                `;
                marker.bindPopup(popupContent);
                this.markers.push(marker);
            }
        });

        // Fit map to markers if there are any
        if (this.markers.length > 0) {
            const group = new L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds());
        }
    }
}