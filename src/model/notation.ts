import { pipOf } from './board';
import type { Seat, Step } from './types';

export const stepsNotation = (seat: Seat, steps: Step[]): string =>
    steps
        .map(
            ({ from, to }) =>
                `${from === 'bar' ? 'bar' : pipOf(seat, from)}/${to === 'off' ? 'off' : pipOf(seat, to)}`,
        )
        .join(' ');
