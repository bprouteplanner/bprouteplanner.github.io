class App {
    constructor() {
        this.state = new StateManager();
        this.mapManager = new MapManager(this.state);
        this.tableManager = new TableManager(this.state, this.mapManager);
        this.themeManager = new ThemeManager();
        
        this.state.registerEventHandlers({
            onStateUpdate: () => this.tableManager.renderTable()
        });
        
        this.bpImporter = new BPImporter(this.state);
        
        window.app = this;
        
        this.initialize();
        this.setupEventListeners();
    }

    initialize() {
        this.mapManager.initMap();
        this.tableManager.renderTable();
    }

    setupEventListeners() {


        const optimizeButton = document.getElementById('optimizeRouteButton');
        if (optimizeButton) {
            optimizeButton.addEventListener('click', async () => {
                optimizeButton.disabled = true;
                optimizeButton.textContent = 'Optimizing...';
                
                try {
                    await this.state.optimizeAndUpdateRoute();
                } finally {
                    optimizeButton.disabled = false;
                    optimizeButton.textContent = 'Optimize Route';
                }
            });
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});