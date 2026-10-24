import { motion } from 'motion/react';
import { useId, useRef, type ReactNode } from 'react';
import { cn } from '../lib/utils';

export type SegmentedOption<T extends string> = {
    value: T;
    label: ReactNode;
    disabled?: boolean;
    hint?: string;
};

export function SegmentedControl<T extends string>({
    value,
    options,
    onValueChange,
    label,
    className,
}: {
    value: T;
    options: SegmentedOption<T>[];
    onValueChange: (value: T) => void;
    label: string;
    className?: string;
}) {
    const id = useId();
    const buttons = useRef<(HTMLButtonElement | null)[]>([]);

    const select = (from: number, step: number) => {
        for (let i = 1; i <= options.length; i++) {
            const next = (from + step * i + options.length * i) % options.length;

            if (!options[next].disabled) {
                onValueChange(options[next].value);
                buttons.current[next]?.focus();

                return;
            }
        }
    };

    return (
        <div
            role="radiogroup"
            aria-label={label}
            className={cn(
                'inline-flex rounded-[10px] bg-foreground/[0.06] p-0.5 dark:bg-white/10',
                className,
            )}
        >
            {options.map((option, i) => {
                const selected = option.value === value;

                return (
                    <button
                        key={option.value}
                        ref={(el) => {
                            buttons.current[i] = el;
                        }}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={option.disabled}
                        title={option.disabled ? option.hint : undefined}
                        tabIndex={selected ? 0 : -1}
                        className={cn(
                            'relative flex h-7 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            selected
                                ? 'text-foreground'
                                : 'text-muted-foreground hover:text-foreground',
                            option.disabled &&
                                'cursor-not-allowed opacity-40 hover:text-muted-foreground',
                        )}
                        onClick={() => onValueChange(option.value)}
                        onKeyDown={(event) => {
                            const steps: Record<string, number> = {
                                ArrowRight: 1,
                                ArrowLeft: -1,
                            };

                            if (event.key in steps) {
                                event.preventDefault();
                                select(i, steps[event.key]);
                            }
                        }}
                    >
                        {selected && (
                            <motion.span
                                layoutId={`${id}-thumb`}
                                className="absolute inset-0 rounded-lg bg-background shadow-[0_1px_2px_rgb(0_0_0/0.12),0_3px_8px_-2px_rgb(0_0_0/0.12)] dark:bg-neutral-700"
                                transition={{
                                    type: 'spring',
                                    stiffness: 500,
                                    damping: 38,
                                }}
                            />
                        )}
                        <span className="relative flex items-center gap-1.5">
                            {option.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
