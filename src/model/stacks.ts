import { other } from './board';
import type { Board, Seat, Step } from './types';

/** Checker ids stacked bottom to top on each point, the bar and the tray. */
export interface Stacks {
    points: string[][];
    bar: [string[], string[]];
    off: [string[], string[]];
}

const seatOf = (id: string): Seat => (id[0] === '0' ? 0 : 1);

export function stacksOf(board: Board): Stacks {
    const next: [number, number] = [0, 0];
    const make = (seat: Seat, n: number) =>
        Array.from({ length: n }, () => `${seat}:${next[seat]++}`);
    return {
        points: board.points.map((n) => make(n > 0 ? 0 : 1, Math.abs(n))),
        bar: [make(0, board.bar[0]), make(1, board.bar[1])],
        off: [make(0, board.off[0]), make(1, board.off[1])],
    };
}

/** Moves the same checkers the steps move, so ids follow them across frames. */
export function moveStacks(stacks: Stacks, seat: Seat, steps: Step[]): Stacks {
    const s: Stacks = {
        points: stacks.points.map((p) => [...p]),
        bar: [[...stacks.bar[0]], [...stacks.bar[1]]],
        off: [[...stacks.off[0]], [...stacks.off[1]]],
    };
    for (const step of steps) {
        const source = step.from === 'bar' ? s.bar[seat] : s.points[step.from];
        const id = source.pop();
        if (id === undefined) continue;
        if (step.to === 'off') {
            s.off[seat].push(id);
            continue;
        }
        const target = s.points[step.to];
        if (target.length === 1 && seatOf(target[0]) !== seat)
            s.bar[other(seat)].push(target.pop()!);
        target.push(id);
    }
    return s;
}

/** Keeps ids on the checkers that stay put, so only the ones that moved travel. */
export function reconcileStacks(prev: Stacks, board: Board): Stacks {
    const pool: [string[], string[]] = [[], []];
    const spare: [number, number] = [1000, 1000];
    const settle = (stack: string[], seat: Seat, count: number) => {
        const kept =
            stack.length > 0 && seatOf(stack[0]) !== seat ? [] : stack.slice();
        kept.length = Math.min(kept.length, count);
        for (const id of stack)
            if (!kept.includes(id)) pool[seatOf(id)].push(id);
        return kept;
    };
    const fill = (stack: string[], seat: Seat, count: number) => {
        while (stack.length < count)
            stack.push(pool[seat].shift() ?? `${seat}:${spare[seat]++}`);
        return stack;
    };
    const seats: Seat[] = [0, 1];
    const points = board.points.map((n, i) =>
        settle(prev.points[i] ?? [], n > 0 ? 0 : 1, Math.abs(n)),
    );
    const bar = seats.map((s) => settle(prev.bar[s], s, board.bar[s]));
    const off = seats.map((s) => settle(prev.off[s], s, board.off[s]));
    return {
        points: points.map((stack, i) =>
            fill(stack, board.points[i] > 0 ? 0 : 1, Math.abs(board.points[i])),
        ),
        bar: [fill(bar[0], 0, board.bar[0]), fill(bar[1], 1, board.bar[1])],
        off: [fill(off[0], 0, board.off[0]), fill(off[1], 1, board.off[1])],
    };
}
