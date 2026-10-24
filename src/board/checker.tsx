import type { Seat } from '../model/index';
import { motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { R } from './geometry';

const spring = {
    type: 'spring',
    stiffness: 360,
    damping: 30,
    mass: 0.9,
} as const;
const still = { duration: 0 } as const;

export function Checker({
    seat,
    slab,
    fills,
    x,
    y,
    animate = false,
    dragging = false,
}: {
    seat: Seat;
    slab?: boolean;
    fills: [string, string];
    x: number;
    y: number;
    animate?: boolean;
    dragging?: boolean;
}) {
    const last = useRef({ x, y });
    const moved = animate && (last.current.x !== x || last.current.y !== y);

    useEffect(() => {
        last.current = { x, y };
    });

    return (
        <motion.g
            className={`checker checker--${seat}`}
            initial={false}
            style={
                dragging
                    ? {
                          pointerEvents: 'none',
                          filter: 'drop-shadow(0 8px 8px rgba(0, 0, 0, 0.45))',
                      }
                    : undefined
            }
            animate={{
                x,
                y,
                scale: dragging ? 1.12 : moved ? [1, 1.14, 1] : 1,
            }}
            transition={
                dragging
                    ? { x: still, y: still, scale: { duration: 0.12 } }
                    : animate
                      ? {
                            x: spring,
                            y: spring,
                            scale: { duration: 0.5, times: [0, 0.35, 1] },
                        }
                      : still
            }
        >
            {slab ? (
                <rect
                    className="checker__slab"
                    x={-20}
                    y={-7}
                    width={40}
                    height={14}
                    rx={3}
                    fill={`url(#${fills[seat]})`}
                />
            ) : (
                <>
                    <circle r={R - 0.5} fill={`url(#${fills[seat]})`} />
                    <circle className="checker__ring" r={R * 0.64} />
                </>
            )}
        </motion.g>
    );
}

export function CheckerFills({ ids }: { ids: [string, string] }) {
    return (
        <>
            {ids.map((id, seat) => (
                <radialGradient key={id} id={id} cx="38%" cy="32%" r="75%">
                    <stop offset="0" className={`checker-stop-${seat}-hi`} />
                    <stop offset="0.6" className={`checker-stop-${seat}`} />
                    <stop offset="1" className={`checker-stop-${seat}-lo`} />
                </radialGradient>
            ))}
        </>
    );
}
