const path = require('path');

describe('003 hiragana ordered trace engine', () => {
    const modulePath = path.join(__dirname, '..', 'games', '003_hiragana_suisui', 'js', 'trace-engine.js');
    let traceEngine;

    beforeEach(() => {
        jest.resetModules();
        traceEngine = require(modulePath);
    });

    it('should only start tracing near the first guide point', () => {
        const tracker = new traceEngine.OrderedStrokeTracker([
            { x: 10, y: 10 },
            { x: 30, y: 10 },
            { x: 50, y: 10 }
        ], {
            hitRadius: 16
        });

        expect(tracker.start({ x: 50, y: 50 })).toBe(false);
        expect(tracker.snapshot()).toEqual(expect.objectContaining({
            active: false,
            currentIndex: 0
        }));
    });

    it('should keep the target dot on the sampled path and only advance forward in order', () => {
        const tracker = new traceEngine.OrderedStrokeTracker([
            { x: 10, y: 10 },
            { x: 30, y: 10 },
            { x: 50, y: 10 },
            { x: 70, y: 10 },
            { x: 90, y: 10 },
            { x: 110, y: 10 }
        ], {
            hitRadius: 18,
            lookAheadPoints: 2,
            completionRatio: 0.95
        });

        expect(tracker.start({ x: 12, y: 8 })).toBe(true);

        tracker.move({ x: 92, y: 12 });
        expect(tracker.snapshot()).toEqual(expect.objectContaining({
            currentIndex: 0,
            currentPoint: { x: 10, y: 10 },
            completed: false
        }));

        tracker.move({ x: 29, y: 11 });
        tracker.move({ x: 49, y: 10 });
        tracker.move({ x: 71, y: 11 });
        tracker.move({ x: 92, y: 8 });
        const endState = tracker.move({ x: 109, y: 11 });

        expect(endState).toEqual(expect.objectContaining({
            currentIndex: 5,
            currentPoint: { x: 110, y: 10 },
            completed: true
        }));
    });

    it('should resume from the current target dot after dragging is interrupted', () => {
        const tracker = new traceEngine.OrderedStrokeTracker([
            { x: 10, y: 10 },
            { x: 30, y: 10 },
            { x: 50, y: 10 },
            { x: 70, y: 10 }
        ], {
            hitRadius: 18,
            lookAheadPoints: 2,
            completionRatio: 0.95
        });

        expect(tracker.start({ x: 10, y: 10 })).toBe(true);
        tracker.move({ x: 30, y: 11 });
        tracker.move({ x: 43, y: 10 });

        expect(tracker.stop()).toEqual(expect.objectContaining({
            active: false,
            completed: false,
            currentIndex: 2,
            currentPoint: { x: 50, y: 10 }
        }));

        expect(tracker.start({ x: 51, y: 12 })).toBe(true);
        expect(tracker.snapshot()).toEqual(expect.objectContaining({
            active: true,
            currentIndex: 2,
            currentPoint: { x: 50, y: 10 }
        }));
    });

    it('should prefer the furthest reachable forward point so the target dot follows faster drags', () => {
        const tracker = new traceEngine.OrderedStrokeTracker([
            { x: 10, y: 10 },
            { x: 20, y: 10 },
            { x: 30, y: 10 },
            { x: 40, y: 10 },
            { x: 50, y: 10 }
        ], {
            hitRadius: 12,
            lookAheadPoints: 4,
            completionRatio: 0.99
        });

        expect(tracker.start({ x: 10, y: 10 })).toBe(true);
        tracker.move({ x: 20, y: 10 });
        const state = tracker.move({ x: 44, y: 10 });

        expect(state).toEqual(expect.objectContaining({
            currentIndex: 4,
            currentPoint: { x: 50, y: 10 }
        }));
    });
});
