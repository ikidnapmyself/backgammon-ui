import { describe, expect, it } from 'vitest';
import { pipCount, reconcileStacks, startBoard, stacksOf, stepsNotation } from '../index';

describe('model', () => {
    it('counts 167 pips for each seat at the start', () => {
        expect(pipCount(startBoard(), 0)).toBe(167);
        expect(pipCount(startBoard(), 1)).toBe(167);
    });

    it('writes steps in point numbers from the mover side', () => {
        expect(stepsNotation(0, [{ from: 'bar', to: 18 }, { from: 5, to: 'off' }])).toBe('bar/19 6/off');
        expect(stepsNotation(1, [{ from: 18, to: 12 }])).toBe('6/12');
    });

    it('gives each checker an id and keeps ids on checkers that stay put', () => {
        const board = startBoard();
        const before = stacksOf(board);
        expect(before.points.flat()).toHaveLength(30);

        const moved = structuredClone(board);
        moved.points[5] -= 1;
        moved.points[4] += 1;
        const after = reconcileStacks(before, moved);

        expect(after.points[7]).toEqual(before.points[7]);
        expect(after.points.flat()).toHaveLength(30);
    });
});
