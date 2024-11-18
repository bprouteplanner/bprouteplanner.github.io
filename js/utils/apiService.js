class APIService {
    static async fetchBPDetails(bpNumber) {
        if (!CONFIG.BP_FORMAT.test(bpNumber)) {
            throw new Error(`Invalid BP number format: ${bpNumber}`);
        }

        const response = await fetch(
            `${CONFIG.API_URL}?$select=originaladdress,description,latitude,longitude&$where=permitnum=%27${bpNumber}%27`
        );
        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('No data found for BP number');
        }

        const {originaladdress, description, latitude, longitude} = data[0];
        return {
            address: `<a target="_blank" href="${CONFIG.GOOGLE_MAP_URL}${latitude},${longitude}">${originaladdress}</a>`,
            description,
            lat: latitude,
            lon: longitude
        };
    }
}
