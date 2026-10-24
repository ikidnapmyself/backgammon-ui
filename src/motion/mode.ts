import { createContext, useContext } from 'react';

export type MotionMode = 'full' | 'quick' | 'static';

export const MotionModeContext = createContext<MotionMode>('full');

export function useMotionMode(): MotionMode {
    return useContext(MotionModeContext);
}
