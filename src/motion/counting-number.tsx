import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useEffect } from 'react';
import { useMotionMode } from './mode';

/**
 * Renders a `tspan`, so it only belongs inside SVG `<text>`.
 */
export default function CountingNumber({ value }: { value: number }) {
    const mode = useMotionMode();
    const count = useMotionValue(value);
    const rounded = useTransform(count, Math.round);

    useEffect(() => {
        if (mode === 'static') {
            count.set(value);

            return;
        }

        const controls = animate(count, value, {
            duration: 0.3,
            ease: 'easeOut',
        });

        return () => controls.stop();
    }, [count, mode, value]);

    if (mode === 'static') {
        return <>{value}</>;
    }

    return <motion.tspan>{rounded}</motion.tspan>;
}
