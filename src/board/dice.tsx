import type { Seat } from '../model/index';
import { motion } from 'motion/react';

const SPOTS: Record<number, [number, number][]> = {
    1: [[0, 0]],
    2: [
        [-1, -1],
        [1, 1],
    ],
    3: [
        [-1, -1],
        [0, 0],
        [1, 1],
    ],
    4: [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
    ],
    5: [
        [-1, -1],
        [1, -1],
        [0, 0],
        [-1, 1],
        [1, 1],
    ],
    6: [
        [-1, -1],
        [1, -1],
        [-1, 0],
        [1, 0],
        [-1, 1],
        [1, 1],
    ],
};
const SIZE = 44;
const GAP = 10;

function Die({
    value,
    seat,
    x,
    y,
    index,
    animate,
}: {
    value: number;
    seat: Seat;
    x: number;
    y: number;
    index: number;
    animate: boolean;
}) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <motion.g
                className={`die die--${seat}`}
                initial={
                    animate
                        ? {
                              rotate: index % 2 ? 140 : -140,
                              scale: 0.4,
                              opacity: 0,
                          }
                        : false
                }
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                transition={{
                    type: 'spring',
                    stiffness: 260,
                    damping: 17,
                    delay: index * 0.06,
                }}
            >
                <rect
                    x={-SIZE / 2}
                    y={-SIZE / 2}
                    width={SIZE}
                    height={SIZE}
                    rx={9}
                />
                {SPOTS[value]?.map(([dx, dy], i) => (
                    <circle key={i} cx={dx * 11} cy={dy * 11} r={4.4} />
                ))}
            </motion.g>
        </g>
    );
}

export function Dice({
    values,
    seat,
    x,
    y,
    animate = false,
    dimmed = false,
}: {
    values: number[];
    seat: Seat;
    x: number;
    y: number;
    animate?: boolean;
    dimmed?: boolean;
}) {
    const doubled = values.length === 4;
    const width = values.length * SIZE + (values.length - 1) * GAP;

    return (
        <g
            role="img"
            className={dimmed ? 'dice--dimmed' : undefined}
            aria-label={`Dice ${values.slice(0, doubled ? 1 : 2).join(' and ')}${doubled ? ' doubled' : ''}`}
        >
            {values.map((value, i) => (
                <Die
                    key={`${seat}-${values.join('')}-${i}`}
                    index={i}
                    animate={animate}
                    value={value}
                    seat={seat}
                    x={x - width / 2 + SIZE / 2 + i * (SIZE + GAP)}
                    y={y}
                />
            ))}
        </g>
    );
}
