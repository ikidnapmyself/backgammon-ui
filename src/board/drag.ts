import type { Seat, Step } from '../model/index';
import {
    BAR_X,
    BOTTOM,
    FY,
    H,
    MID,
    PH,
    PW,
    slot,
    TOP,
    TRAY,
    TRAY_X,
} from './geometry';

export type Point = { x: number; y: number };
export type Spot = Step['from'] | Step['to'];

export const REACH = PW * 1.1;

export function spotCenter(spot: Spot, viewer: Seat): Point {
    if (spot === 'bar') {
        return { x: BAR_X, y: MID - 55 };
    }

    if (spot === 'off') {
        return { x: TRAY_X + TRAY / 2, y: H - FY - (PH + 16) / 2 };
    }

    const { top, cx } = slot(spot, viewer);

    return { x: cx, y: top ? TOP + PH / 2 : BOTTOM - PH / 2 };
}

function inZone(point: Point, spot: Spot, viewer: Seat): boolean {
    if (spot === 'bar') {
        return false;
    }

    if (spot === 'off') {
        return point.x >= TRAY_X && point.x <= TRAY_X + TRAY && point.y > MID;
    }

    const { top, x } = slot(spot, viewer);

    return (
        point.x >= x &&
        point.x <= x + PW &&
        (top ? point.y >= 0 && point.y <= MID : point.y > MID && point.y <= H)
    );
}

export function nearestTarget(
    point: Point,
    targets: Spot[],
    viewer: Seat,
): Spot | null {
    const inside = targets.find((target) => inZone(point, target, viewer));

    if (inside !== undefined) {
        return inside;
    }

    let best: Spot | null = null;
    let bestDistance = REACH;

    for (const target of targets) {
        const center = spotCenter(target, viewer);
        const distance = Math.hypot(center.x - point.x, center.y - point.y);

        if (distance < bestDistance) {
            best = target;
            bestDistance = distance;
        }
    }

    return best;
}

export const DRAG_THRESHOLD = 4;

export type DragOutcome = 'click' | 'drop' | 'cancel';

export function travelled(from: Point, to: Point): number {
    return Math.hypot(to.x - from.x, to.y - from.y);
}

export function dragOutcome(travel: number, hover: Spot | null): DragOutcome {
    if (travel < DRAG_THRESHOLD) {
        return 'click';
    }

    return hover === null ? 'cancel' : 'drop';
}
