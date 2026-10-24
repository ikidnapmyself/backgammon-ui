import { describe, expect, it } from 'vitest';
import { H, MID } from './geometry';
import {
    dragOutcome,
    DRAG_THRESHOLD,
    nearestTarget,
    REACH,
    spotCenter,
    travelled,
    type Point,
} from './drag';

const near = (p: Point, dx: number, dy: number): Point => ({
    x: p.x + dx,
    y: p.y + dy,
});

describe('nearestTarget', () => {
    it('snaps to the closest target within reach', () => {
        const center = spotCenter(5, 0);

        expect(nearestTarget(near(center, 6, -9), [5, 9], 0)).toBe(5);
    });

    it('returns null when far from every target', () => {
        expect(nearestTarget({ x: 0, y: 0 }, [5, 'off'], 0)).toBeNull();
    });

    it('returns null just outside reach', () => {
        const center = spotCenter(5, 0);

        expect(nearestTarget(near(center, REACH, 0), [5], 0)).toBeNull();
    });

    it('handles off and bar targets', () => {
        const off = spotCenter('off', 0);
        const bar = spotCenter('bar', 0);

        expect(nearestTarget(near(off, 3, 3), ['off', 5], 0)).toBe('off');
        expect(nearestTarget(near(bar, -3, 3), ['bar', 5], 0)).toBe('bar');
    });

    it('picks the nearer of two targets', () => {
        const a = spotCenter(5, 0);
        const b = spotCenter(6, 0);
        const point = near(a, (b.x - a.x) * 0.6, 0);

        expect(nearestTarget(point, [5, 6], 0)).toBe(6);
    });
});

describe('travelled', () => {
    it('measures straight-line distance', () => {
        expect(travelled({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    });
});

describe('dragOutcome', () => {
    it('treats a short press as a click even over a target', () => {
        expect(dragOutcome(DRAG_THRESHOLD - 1, 5)).toBe('click');
    });

    it('drops on a hovered target after a real drag', () => {
        expect(dragOutcome(DRAG_THRESHOLD, 5)).toBe('drop');
        expect(dragOutcome(50, 'off')).toBe('drop');
    });

    it('cancels a real drag that ends away from every target', () => {
        expect(dragOutcome(50, null)).toBe('cancel');
    });

    it('accepts a drop anywhere in the point column, tip to base', () => {
        const centre = spotCenter(3, 0);
        const edge = centre.y < MID ? 30 : H - 30;

        expect(nearestTarget({ x: centre.x + 25, y: edge }, [3], 0)).toBe(3);
        expect(nearestTarget({ x: centre.x, y: H - edge }, [3], 0)).toBeNull();
    });

    it('accepts a drop anywhere in the lower half of the tray', () => {
        const tray = spotCenter('off', 0);

        expect(nearestTarget({ x: tray.x, y: MID + 20 }, ['off'], 0)).toBe(
            'off',
        );
    });
});
