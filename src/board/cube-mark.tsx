import { motion } from 'motion/react';

export function CubeMark({
    value,
    x,
    y,
    offered,
    passed,
    animate = false,
}: {
    value: number;
    x: number;
    y: number;
    offered?: boolean;
    passed?: boolean;
    animate?: boolean;
}) {
    const shown = value === 1 ? 64 : value;
    const lifting = animate && offered && !passed;
    const glide = animate
        ? { type: 'spring' as const, stiffness: 170, damping: 22 }
        : { duration: 0 };

    return (
        <motion.g
            className={
                passed
                    ? 'cube cube--passed'
                    : offered
                      ? 'cube cube--offered'
                      : 'cube'
            }
            role="img"
            aria-label={
                passed
                    ? `Cube at ${value} passed`
                    : value === 1
                      ? 'Cube centred'
                      : `Cube at ${value}`
            }
            initial={false}
            animate={{
                x,
                y,
                scale: lifting ? [1, 1.3, 1] : 1,
                opacity: passed ? 0.45 : 1,
            }}
            transition={{
                x: glide,
                y: glide,
                scale: { duration: 0.55, times: [0, 0.35, 1] },
                opacity: { duration: animate ? 0.4 : 0 },
            }}
        >
            {offered && !passed && (
                <motion.rect
                    className="cube__ring"
                    x={-19}
                    y={-19}
                    width={38}
                    height={38}
                    rx={7}
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{ scale: 1.6, opacity: 0 }}
                    transition={{
                        duration: 1.4,
                        repeat: Infinity,
                        ease: 'easeOut',
                    }}
                />
            )}
            <rect x={-19} y={-19} width={38} height={38} rx={7} />
            <motion.text
                key={shown}
                y={1}
                className={
                    shown >= 10
                        ? 'cube__value cube__value--wide'
                        : 'cube__value'
                }
                initial={animate ? { scaleY: 0 } : false}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.25, delay: 0.15 }}
            >
                {shown}
            </motion.text>
        </motion.g>
    );
}

export function PassedChip({ x, y }: { x: number; y: number }) {
    return (
        <motion.g
            className="cube-chip"
            role="img"
            aria-label="Passed"
            initial={{ x, y, scale: 0.6, opacity: 0 }}
            animate={{ x, y, scale: 1, opacity: 1 }}
            transition={{
                type: 'spring',
                stiffness: 380,
                damping: 22,
                delay: 0.2,
            }}
        >
            <rect x={-46} y={-17} width={92} height={34} rx={17} />
            <text y={1}>Passed</text>
        </motion.g>
    );
}
