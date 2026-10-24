export type Seat = 0 | 1;

export interface Step {
    from: number | 'bar';
    to: number | 'off';
}

export interface Board {
    points: number[];
    bar: [number, number];
    off: [number, number];
}
