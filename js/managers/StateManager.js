class StateManager {
    constructor() {
        this.map = null;
        this.markers = [];
        this.callList = [];
        this.eventHandlers = {
            onStateUpdate: null
        };
        this.loadFromURL();
    }

    registerEventHandlers(handlers) {
        this.eventHandlers = { ...this.eventHandlers, ...handlers };
    }

    async refreshAllBPData() {
        const fetchPromises = this.callList
            .filter(item => item.bpNumber && item.bpNumber.match(CONFIG.BP_FORMAT))
            .map(item => this.fetchBPDetails(item.bpNumber));

        try {
            const results = await Promise.all(fetchPromises);
            results.forEach((data, index) => {
                if (data) {
                    Object.assign(this.callList[index], data);
                }
            });
            
            // Use the event handler instead of direct reference
            if (this.eventHandlers.onStateUpdate) {
                this.eventHandlers.onStateUpdate();
            }
        } catch (error) {
            console.error('Error refreshing BP data:', error);
        }
    }

    async optimizeAndUpdateRoute() {
        try {
            // Filter out locations without coordinates and parse to float
            const validLocations = this.callList
                .filter(item => item.lat && item.lon)
                .map(item => ({
                    ...item,
                    lat: parseFloat(item.lat),
                    lon: parseFloat(item.lon)
                }))
                .filter(item => !isNaN(item.lat) && !isNaN(item.lon));
    
            if (validLocations.length < 2) {
                alert('Need at least 2 valid locations to optimize route');
                return;
            }
    
            // Sort by current rank to ensure consistent starting point
            validLocations.sort((a, b) => a.rank - b.rank);
    
            // Optimize route
            const optimizedLocations = RouteOptimizer.optimizeRoute(validLocations);
    
            // Update ranks based on optimized order
            optimizedLocations.forEach((location, index) => {
                const originalItem = this.callList.find(
                    item => item.bpNumber === location.bpNumber
                );
                if (originalItem) {
                    originalItem.rank = index + 1;
                }
            });
    
            // Sort the callList based on new ranks
            this.callList.sort((a, b) => a.rank - b.rank);
    
            // Update URL and trigger render
            this.updateURL();
            if (this.eventHandlers.onStateUpdate) {
                this.eventHandlers.onStateUpdate();
            }
    
            console.log('Route optimization complete');
            
        } catch (error) {
            console.error('Route optimization failed:', error);
            alert('Unable to optimize route. Please try again.');
        }
    }
    
        
            loadFromURL() {
                const urlParams = new URLSearchParams(window.location.search);
                const encodedString = urlParams.get('data');
                
                if (encodedString) {
                    try {
                        // Only load rank and bpNumber from URL
                        const data = JSON.parse(decodeURIComponent(encodedString));
                        this.callList = data.map(item => ({
                            rank: item.rank,
                            bpNumber: item.bpNumber,
                            address: "",
                            description: "",
                            lat: null,
                            lon: null
                        }));
                        
                        // Fetch BP details for each item
                        this.refreshAllBPData();
                    } catch (error) {
                        console.error('Error parsing URL data:', error);
                        this.initializeEmptyList();
                    }
                } else {
                    this.initializeEmptyList();
                }
            }
        
            initializeEmptyList() {
                this.callList = [{
                    rank: 1,
                    bpNumber: "",
                    address: "",
                    description: "",
                    lat: null,
                    lon: null
                }];
            }
        
        
            updateURL() {
                // Only store essential data in URL
                const essentialData = this.callList.map(item => ({
                    rank: item.rank,
                    bpNumber: item.bpNumber
                }));
                const jsonString = JSON.stringify(essentialData);
                const encodedString = encodeURIComponent(jsonString);
                const newURL = `${window.location.origin}${window.location.pathname}?data=${encodedString}`;
                window.history.pushState({ path: newURL }, '', newURL);
            }
        
            async refreshAllBPData() {
                const fetchPromises = this.callList
                    .filter(item => item.bpNumber && item.bpNumber.match(CONFIG.BP_FORMAT))
                    .map(async (item, index) => {
                        try {
                            const details = await this.fetchBPDetails(item.bpNumber);
                            if (details) {
                                this.callList[index] = {
                                    ...this.callList[index],
                                    ...details
                                };
                            }
                        } catch (error) {
                            console.error(`Error fetching details for BP ${item.bpNumber}:`, error);
                        }
                    });
        
                try {
                    await Promise.all(fetchPromises);
                    if (this.eventHandlers.onStateUpdate) {
                        this.eventHandlers.onStateUpdate();
                    }
                } catch (error) {
                    console.error('Error refreshing BP data:', error);
                }
            }
        
            async fetchBPDetails(bpNumber) {
                if (!CONFIG.BP_FORMAT.test(bpNumber)) {
                    throw new Error(`Invalid BP number format: ${bpNumber}`);
                }
        
                const response = await fetch(
                    `${CONFIG.API_URL}?$select=originaladdress,description,latitude,longitude&$where=permitnum=%27${bpNumber}%27`
                );
                const data = await response.json();
        
                if (Array.isArray(data) && data.length > 0) {
                    const {originaladdress, description, latitude, longitude} = data[0];
                    if (latitude && longitude && originaladdress && description) {
                        return {
                            address: `<a target="_blank" href="${CONFIG.GOOGLE_MAP_URL}${latitude},${longitude}">${originaladdress}</a>`,
                            description,
                            lat: latitude,
                            lon: longitude
                        };
                    }
                }
                return null;
            }
        
            addRow() {
                const newRank = this.callList.length + 1;
                this.callList.push({
                    rank: newRank,
                    bpNumber: "",
                    address: "",
                    description: "",
                    lat: null,
                    lon: null
                });
                this.updateURL();
            }
        
            deleteRow(index) {
                if (index < 0 || index >= this.callList.length) {
                    throw new Error('Invalid index for deletion');
                }
        
                // Remove the row
                this.callList.splice(index, 1);
        
                // Update ranks
                this.callList.forEach((item, i) => {
                    item.rank = i + 1;
                });
        
                // Update URL
                this.updateURL();
        
                // Trigger state update
                if (this.eventHandlers.onStateUpdate) {
                    this.eventHandlers.onStateUpdate();
                }
            }
        
            updateRanksAfterDelete() {
                this.callList.forEach((row, index) => {
                    row.rank = index + 1;
                });
            }
        
            async updateBPNumber(index, newBPNumber) {
                this.callList[index].bpNumber = newBPNumber;
                this.updateURL();
                
                if (newBPNumber.match(CONFIG.BP_FORMAT)) {
                    const details = await this.fetchBPDetails(newBPNumber);
                    if (details) {
                        Object.assign(this.callList[index], details);
                    }
                }
            }
        
            updateRank(index, newRank) {
                this.callList[index].rank = parseInt(newRank);
                this.updateURL();
            }
        
            swapRows(fromIndex, toIndex) {
                // Swap ranks between the rows
                const fromRank = this.callList[fromIndex].rank;
                this.callList[fromIndex].rank = this.callList[toIndex].rank;
                this.callList[toIndex].rank = fromRank;
                this.updateURL();
            }

   
        }