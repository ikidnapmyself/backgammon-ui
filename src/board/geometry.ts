import { pipOf, type Seat } from '../model/index';

export const FX = 10;
export const FY = 22;
export const RAIL = 46;
export const PW = 62;
export const BAR = 56;
export const TRAY = 54;
export const R = 28;
export const PAD = 8;
export const PH = 5 * 2 * R;
export const GAP = 96;
export const W = FX + RAIL + 6 * PW + BAR + 6 * PW + TRAY + FX;
export const H = 2 * FY + 2 * PAD + 2 * PH + GAP;
export const TOP = FY + PAD;
export const BOTTOM = H - FY - PAD;
export const MID = H / 2;
export const FIELD = FX + RAIL;
export const BAR_X = FIELD + 6 * PW + BAR / 2;
export const TRAY_X = FIELD + 12 * PW + BAR;
export const RAIL_X = FX + RAIL / 2;
export const SLAB = 18;

// Columns run 0..11 left to right, the viewer's home is the bottom right.
export function slot(i: number, viewer: Seat) {
    const pip = pipOf(viewer, i);
    const top = pip >= 13;
    const col = top ? pip - 13 : 12 - pip;
    const x = FIELD + col * PW + (col >= 6 ? BAR : 0);

    return { pip, top, col, x, cx: x + PW / 2 };
}

export function checkerAt(i: number, viewer: Seat, k: number) {
    const { top, cx } = slot(i, viewer);
    const n = Math.min(k, 4);

    return { x: cx, y: top ? TOP + R + n * 2 * R : BOTTOM - R - n * 2 * R };
}

export function barAt(mine: boolean, k: number) {
    const n = Math.min(k, 2);

    return {
        x: BAR_X,
        y: mine ? MID - R - 12 - n * 2 * R : MID + R + 12 + n * 2 * R,
    };
}

export function offAt(mine: boolean, k: number) {
    return {
        x: TRAY_X + TRAY / 2,
        y: mine
            ? BOTTOM - (k + 1) * SLAB + SLAB / 2
            : TOP + k * SLAB + SLAB / 2,
    };
}
