const CONFIG = {
    API_URL: 'https://data.calgary.ca/resource/c2es-76ed.json',
    GOOGLE_MAP_URL: 'http://maps.google.com/maps?z=12&t=m&q=',
    GOOGLE_ROUTE_URL: 'https://www.google.com/maps/dir/?api=1',
    BP_FORMAT: /[A-Za-z]{2}\d{4}-\d{5}$/,
    BP_IMPORT_FORMAT: /[A-Za-z]{2}\d{4}-\d{5}/g, //g matches multiple
    MAX_WAYPOINTS: 10,
    DEFAULT_MAP_CENTER: [51.0447, -114.0719],
    DEFAULT_ZOOM: 10
};
