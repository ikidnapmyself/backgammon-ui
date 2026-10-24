import type { Board, Seat } from './types';

export const BAR = 25;
export const sign = (seat: Seat) => (seat === 0 ? 1 : -1);
export const other = (seat: Seat): Seat => (seat === 0 ? 1 : 0);
export const idx = (seat: Seat, pip: number) =>
    seat === 0 ? pip - 1 : 24 - pip;
export const pipOf = (seat: Seat, i: number) => (seat === 0 ? i + 1 : 24 - i);

export function own(b: Board, seat: Seat, pip: number) {
    if (pip === BAR) return b.bar[seat];
    return Math.max(0, sign(seat) * b.points[idx(seat, pip)]);
}

export function pipCount(b: Board, seat: Seat) {
    let sum = b.bar[seat] * BAR;
    for (let p = 1; p <= 24; p++) sum += own(b, seat, p) * p;
    return sum;
}

export function startBoard(): Board {
    const points = Array<number>(24).fill(0);
    for (const [pip, n] of [
        [24, 2],
        [13, 5],
        [8, 3],
        [6, 5],
    ]) {
        points[idx(0, pip)] += n;
        points[idx(1, pip)] -= n;
    }
    return { points, bar: [0, 0], off: [0, 0] };
}
