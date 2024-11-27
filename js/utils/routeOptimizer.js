class RouteOptimizer {
    static optimizeRoute(locations) {
        if (locations.length <= 2) return locations;

        try {
            // Start with nearest neighbor solution
            const start = locations[0];
            const remainingPoints = locations.slice(1);
            let route = [start];
            
            // Build initial route using nearest neighbor
            let currentPoint = start;
            while (remainingPoints.length > 0) {
                let nearestIndex = 0;
                let shortestDistance = this.calculateDistance(
                    currentPoint.lat, currentPoint.lon,
                    remainingPoints[0].lat, remainingPoints[0].lon
                );

                for (let i = 1; i < remainingPoints.length; i++) {
                    const distance = this.calculateDistance(
                        currentPoint.lat, currentPoint.lon,
                        remainingPoints[i].lat, remainingPoints[i].lon
                    );
                    if (distance < shortestDistance) {
                        shortestDistance = distance;
                        nearestIndex = i;
                    }
                }

                currentPoint = remainingPoints[nearestIndex];
                route.push(currentPoint);
                remainingPoints.splice(nearestIndex, 1);
            }

            // Apply 2-opt improvement
            let improvement = true;
            let iterations = 0;
            const maxIterations = 100; // Prevent infinite loops

            while (improvement && iterations < maxIterations) {
                improvement = false;
                iterations++;

                // Try all possible segment swaps
                for (let i = 1; i < route.length - 2; i++) {
                    for (let j = i + 1; j < route.length - 1; j++) {
                        const oldDistance = 
                            this.calculateDistance(
                                route[i-1].lat, route[i-1].lon,
                                route[i].lat, route[i].lon
                            ) +
                            this.calculateDistance(
                                route[j].lat, route[j].lon,
                                route[j+1].lat, route[j+1].lon
                            );

                        const newDistance = 
                            this.calculateDistance(
                                route[i-1].lat, route[i-1].lon,
                                route[j].lat, route[j].lon
                            ) +
                            this.calculateDistance(
                                route[i].lat, route[i].lon,
                                route[j+1].lat, route[j+1].lon
                            );

                        // If new route would be shorter, swap segments
                        if (newDistance < oldDistance) {
                            // Reverse the segment between i and j
                            const segment = route.slice(i, j + 1);
                            segment.reverse();
                            route = [...route.slice(0, i), ...segment, ...route.slice(j + 1)];
                            improvement = true;
                        }
                    }
                }
            }

            return route;

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