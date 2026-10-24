import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/utils';

export function BoardDock({
    className,
    children,
    ...props
}: {
    className?: string;
    children: ReactNode;
} & Omit<ComponentProps<'div'>, 'className' | 'children'>) {
    return (
        <div
            {...props}
            className={cn(
                'relative z-10 mx-auto w-full max-w-2xl rounded-[22px] border border-white/50 bg-background/75 p-1.5 shadow-[0_10px_30px_-12px_rgb(0_0_0/0.45),0_2px_6px_-2px_rgb(0_0_0/0.15)] backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-neutral-900/70',
                className,
            )}
        >
            {children}
        </div>
    );
}
