class MapManager {
    constructor(state) {
        this.state = state;
        this.map = null;
        this.markers = [];
    }

    initMap() {
        this.map = L.map('map').setView(CONFIG.DEFAULT_MAP_CENTER, CONFIG.DEFAULT_ZOOM);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);
    }

    createNumberedIcon(number) {
        return L.divIcon({
            className: 'custom-number-icon',
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
                
                marker.bindPopup(`<b>${item.bpNumber}</b><br>${item.address}`);
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