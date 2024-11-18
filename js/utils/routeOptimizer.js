class RouteOptimizer {
    static optimizeRoute(locations) {
        if (locations.length <= 2) return locations;

        try {
            // Keep first location (rank 1) as start point
            const start = locations[0];
            const remainingPoints = locations.slice(1);
            const optimizedRoute = [start];
            
            let currentPoint = start;
            
            // Find nearest neighbor for each point
            while (remainingPoints.length > 0) {
                let nearestIndex = 0;
                let shortestDistance = this.calculateDistance(
                    currentPoint.lat, 
                    currentPoint.lon,
                    remainingPoints[0].lat,
                    remainingPoints[0].lon
                );

                // Find nearest point
                for (let i = 1; i < remainingPoints.length; i++) {
                    const distance = this.calculateDistance(
                        currentPoint.lat,
                        currentPoint.lon,
                        remainingPoints[i].lat,
                        remainingPoints[i].lon
                    );
                    if (distance < shortestDistance) {
                        shortestDistance = distance;
                        nearestIndex = i;
                    }
                }

                // Add nearest point to route
                currentPoint = remainingPoints[nearestIndex];
                optimizedRoute.push(currentPoint);
                remainingPoints.splice(nearestIndex, 1);
            }

            return optimizedRoute;

        } catch (error) {
            console.error('Route optimization failed:', error);
            return locations;
        }
    }

    static calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    static toRad(degrees) {
        return degrees * (Math.PI/180);
    }
}