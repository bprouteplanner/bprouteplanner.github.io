class URLUtils {
    static getDataFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const encodedString = urlParams.get('data');
        
        if (encodedString) {
            try {
                return JSON.parse(decodeURIComponent(encodedString));
            } catch (error) {
                console.error('Error parsing URL data:', error);
                return null;
            }
        }
        return null;
    }

    static updateURL(data) {
        const jsonString = JSON.stringify(data);
        const encodedString = encodeURIComponent(jsonString);
        const newURL = `${window.location.origin}${window.location.pathname}?data=${encodedString}`;
        window.history.pushState({ path: newURL }, '', newURL);
    }
}