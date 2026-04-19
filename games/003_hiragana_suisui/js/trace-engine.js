(function(factory) {
    const root = typeof window !== 'undefined' ? window : globalThis;
    const traceEngine = factory();

    root.EduToys = root.EduToys || {};
    root.EduToys.hiraganaSuisuiTraceEngine = traceEngine;

    if (typeof module !== 'undefined') {
        module.exports = traceEngine;
    }
})(function() {
    function normalizePoints(points) {
        if (!Array.isArray(points)) {
            return [];
        }

        return points
            .filter((point) => Number.isFinite(point?.x) && Number.isFinite(point?.y))
            .map((point) => ({ x: point.x, y: point.y }));
    }

    function distanceBetween(pointA, pointB) {
        if (!pointA || !pointB) {
            return Number.POSITIVE_INFINITY;
        }

        return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y);
    }

    class OrderedStrokeTracker {
        constructor(points, options = {}) {
            this.points = normalizePoints(points);
            this.hitRadius = Math.max(8, options.hitRadius || 32);
            this.startRadius = Math.max(this.hitRadius, options.startRadius || this.hitRadius * 1.25);
            this.lookAheadPoints = Math.max(1, Math.floor(options.lookAheadPoints || 4));
            this.followRadius = Math.max(this.hitRadius, options.followRadius || this.hitRadius * 1.25);
            this.completionRatio = Math.min(1, Math.max(0.75, options.completionRatio || 0.98));
            this.reset();
        }

        get currentPoint() {
            if (!this.points.length) {
                return null;
            }

            const safeIndex = Math.min(this.currentIndex, this.points.length - 1);
            return this.points[safeIndex];
        }

        get progressRatio() {
            if (this.points.length <= 1) {
                return this.points.length === 1 && this.completed ? 1 : 0;
            }

            return this.currentIndex / (this.points.length - 1);
        }

        get startPoint() {
            if (!this.points.length) {
                return null;
            }

            return this.currentPoint || this.points[0];
        }

        canStart(pointer) {
            return distanceBetween(pointer, this.startPoint) <= this.startRadius;
        }

        start(pointer) {
            if (!this.canStart(pointer)) {
                return false;
            }

            this.active = true;
            if (this.points.length === 1) {
                this.currentIndex = 0;
                this.completed = true;
                this.active = false;
            }

            return true;
        }

        findClosestForwardIndex(pointer) {
            if (!pointer || !this.points.length) {
                return null;
            }

            const lastIndex = this.points.length - 1;
            const upperIndex = Math.min(lastIndex, this.currentIndex + this.lookAheadPoints);
            let furthestReachableIndex = null;
            let bestIndex = null;
            let bestDistance = Number.POSITIVE_INFINITY;

            for (let index = this.currentIndex; index <= upperIndex; index += 1) {
                const distance = distanceBetween(pointer, this.points[index]);
                if (distance <= this.followRadius) {
                    furthestReachableIndex = index;
                }
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestIndex = index;
                }
            }

            if (furthestReachableIndex !== null) {
                return furthestReachableIndex;
            }

            if (bestDistance <= this.hitRadius) {
                return bestIndex;
            }

            return null;
        }

        move(pointer) {
            if (!this.active || this.completed) {
                return this.snapshot();
            }

            const nextIndex = this.findClosestForwardIndex(pointer);
            if (nextIndex !== null && nextIndex > this.currentIndex) {
                this.currentIndex = nextIndex;
            }

            if (this.progressRatio >= this.completionRatio || this.currentIndex >= this.points.length - 1) {
                this.currentIndex = Math.max(0, this.points.length - 1);
                this.completed = true;
                this.active = false;
            }

            return this.snapshot();
        }

        stop() {
            if (this.progressRatio >= this.completionRatio && this.points.length > 0) {
                this.currentIndex = this.points.length - 1;
                this.completed = true;
            }

            this.active = false;
            return this.snapshot();
        }

        reset() {
            this.active = false;
            this.completed = false;
            this.currentIndex = 0;
            return this.snapshot();
        }

        snapshot() {
            return {
                active: this.active,
                completed: this.completed,
                currentIndex: this.currentIndex,
                currentPoint: this.currentPoint ? { ...this.currentPoint } : null,
                progressRatio: this.progressRatio
            };
        }
    }

    return {
        OrderedStrokeTracker,
        distanceBetween
    };
});
