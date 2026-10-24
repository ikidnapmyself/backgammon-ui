import {
    reconcileStacks,
    stacksOf,
    stepsNotation,
    type Board as BoardState,
    type Seat,
    type Stacks,
    type Step,
} from '../model/index';
import { MotionConfig, motion } from 'motion/react';
import {
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type PointerEvent as ReactPointerEvent,
    type ReactNode,
} from 'react';
import CountingNumber from '../motion/counting-number';
import { cn } from '../lib/utils';
import { Checker, CheckerFills } from './checker';
import { CubeMark, PassedChip } from './cube-mark';
import { Dice } from './dice';
import {
    DRAG_THRESHOLD,
    dragOutcome,
    nearestTarget,
    spotCenter,
    travelled,
    type Point,
} from './drag';
import {
    BAR,
    BAR_X,
    BOTTOM,
    FIELD,
    FX,
    FY,
    H,
    MID,
    PH,
    PW,
    RAIL,
    RAIL_X,
    TOP,
    TRAY,
    TRAY_X,
    W,
    barAt,
    checkerAt,
    offAt,
    slot,
} from './geometry';

export type BoardDice = {
    values: number[];
    seat: Seat;
    dimmed?: boolean;
};

export type BoardCube = {
    value: number;
    owner: Seat | null;
    offered: boolean;
    passed?: boolean;
};

export type BoardPick = {
    selectable: Step['from'][];
    selected: Step['from'] | null;
    targets: Step['to'][];
    onSelect: (spot: Step['from'] | Step['to']) => void;
    onGrab: (from: Step['from'] | null) => void;
};

export type BoardMove = {
    seat: Seat;
    steps: Step[];
    tone: (typeof TONES)[number];
};

const TONES = [
    'played',
    'good',
    'doubtful',
    'error',
    'blunder',
    'best',
] as const;

const SEATS = [0, 1] as const;
const POINTS = Array.from({ length: 24 }, (_, i) => i);

function own(board: BoardState, seat: Seat, i: number): number {
    return Math.max(0, (seat === 0 ? 1 : -1) * board.points[i]);
}

const seatOf = (id: string): Seat => (id[0] === '0' ? 0 : 1);

type Spot = { x: number; y: number };

// Walks the steps back from the board after the move so each arrow starts at the checker's old spot.
function arrowPaths(
    board: BoardState,
    viewer: Seat,
    move: BoardMove,
): string[] {
    const counts = {
        points: [...board.points],
        bar: [...board.bar],
        off: [...board.off],
    };
    const mine = (i: number) =>
        Math.max(0, (move.seat === 0 ? 1 : -1) * counts.points[i]);
    const add = (i: number, d: number) => {
        counts.points[i] += (move.seat === 0 ? 1 : -1) * d;
    };
    const paths: string[] = [];

    for (const step of [...move.steps].reverse()) {
        let to: Spot;

        if (step.to === 'off') {
            to = offAt(
                move.seat === viewer,
                Math.max(0, counts.off[move.seat] - 1),
            );
            counts.off[move.seat]--;
        } else {
            to = checkerAt(step.to, viewer, Math.max(0, mine(step.to) - 1));
            add(step.to, -1);
        }

        let from: Spot;

        if (step.from === 'bar') {
            from = barAt(move.seat === viewer, counts.bar[move.seat]);
            counts.bar[move.seat]++;
        } else {
            from = checkerAt(step.from, viewer, mine(step.from));
            add(step.from, 1);
        }

        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;
        const lift = Math.min(90, Math.hypot(to.x - from.x, to.y - from.y) / 4);
        const toward = from.y < MID ? 1 : -1;

        paths.unshift(
            `M${from.x},${from.y} Q${mx},${my + toward * lift} ${to.x},${to.y}`,
        );
    }

    return paths;
}

type Drag = {
    from: Step['from'];
    id: string;
    at: Point;
    hover: Step['to'] | null;
};

type Grab = {
    from: Step['from'];
    id: string;
    start: Point;
    pointerId: number;
    dragging: boolean;
};

function Hit({
    label,
    state,
    center,
    onSelect,
    onPointerDown,
    children,
}: {
    label: string;
    state: 'selectable' | 'selected' | 'target' | 'hover';
    center: Point;
    onSelect: () => void;
    onPointerDown?: (event: ReactPointerEvent<SVGGElement>) => void;
    children: ReactNode;
}) {
    return (
        <g
            role="button"
            tabIndex={0}
            aria-label={label}
            aria-pressed={state === 'selected' ? true : undefined}
            className={`bgb__hit bgb__hit--${state}`}
            style={
                onPointerDown
                    ? { touchAction: 'none', cursor: 'grab' }
                    : undefined
            }
            onPointerDown={onPointerDown}
            onClick={onSelect}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect();
                }
            }}
        >
            {children}
            {(state === 'target' || state === 'hover') && (
                <circle
                    className="bgb__hit-dot"
                    cx={center.x}
                    cy={center.y}
                    r={state === 'hover' ? 18 : 13}
                />
            )}
        </g>
    );
}

function PickLayer({
    pick,
    viewer,
    hover = null,
    onGrabStart,
}: {
    pick: BoardPick;
    viewer: Seat;
    hover?: Step['to'] | null;
    onGrabStart?: (
        spot: Step['from'],
        event: ReactPointerEvent<SVGGElement>,
    ) => void;
}) {
    const stateOf = (spot: Step['from'] | Step['to']) =>
        pick.selected === spot
            ? 'selected'
            : pick.targets.includes(spot as Step['to'])
              ? spot === hover
                  ? 'hover'
                  : 'target'
              : pick.selectable.includes(spot as Step['from'])
                ? 'selectable'
                : null;
    const spots: (Step['from'] | Step['to'])[] = [...POINTS, 'bar', 'off'];

    return (
        <g className="bgb__picks" data-hover={hover ?? undefined}>
            {spots.map((spot) => {
                const state = stateOf(spot);

                if (state === null) {
                    return null;
                }

                const select = () => pick.onSelect(spot);
                const grab =
                    onGrabStart &&
                    spot !== 'off' &&
                    pick.selectable.includes(spot)
                        ? (event: ReactPointerEvent<SVGGElement>) =>
                              onGrabStart(spot, event)
                        : undefined;

                if (spot === 'bar') {
                    return (
                        <Hit
                            key="bar"
                            label="Bar"
                            state={state}
                            center={spotCenter(spot, viewer)}
                            onSelect={select}
                            onPointerDown={grab}
                        >
                            <rect
                                x={BAR_X - BAR / 2}
                                y={MID - 110}
                                width={BAR}
                                height={110}
                                rx={8}
                            />
                        </Hit>
                    );
                }

                if (spot === 'off') {
                    return (
                        <Hit
                            key="off"
                            label="Bear off"
                            state={state}
                            center={spotCenter(spot, viewer)}
                            onSelect={select}
                        >
                            <rect
                                x={TRAY_X + 4}
                                y={H - FY - PH - 16}
                                width={TRAY - 8}
                                height={PH + 16}
                                rx={8}
                            />
                        </Hit>
                    );
                }

                const { top, x, cx, pip } = slot(spot, viewer);
                const base = top ? FY : H - FY;
                const tip = top ? TOP + PH - 14 : BOTTOM - PH + 14;

                return (
                    <Hit
                        key={spot}
                        label={`Point ${pip}`}
                        state={state}
                        center={spotCenter(spot, viewer)}
                        onSelect={select}
                        onPointerDown={grab}
                    >
                        <rect
                            className="bgb__hit-area"
                            x={x}
                            y={top ? FY : MID}
                            width={PW}
                            height={MID - FY}
                        />
                        <polygon
                            points={`${x + 2},${base} ${x + PW - 2},${base} ${cx},${tip}`}
                        />
                    </Hit>
                );
            })}
        </g>
    );
}

export function Board({
    board,
    viewer,
    dice,
    cube,
    pips,
    stacks,
    move,
    pick,
    animate = false,
}: {
    board: BoardState;
    viewer: Seat;
    dice?: BoardDice | null;
    cube?: BoardCube | null;
    pips?: [number, number];
    stacks?: Stacks;
    move?: BoardMove | null;
    pick?: BoardPick | null;
    animate?: boolean;
}) {
    const uid = useId().replace(/:/g, '');
    const tracked = useRef<Stacks | null>(null);
    const ids: Stacks =
        stacks ?? reconcileStacks(tracked.current ?? stacksOf(board), board);
    tracked.current = ids;
    const arrows = useMemo(
        () => (move ? arrowPaths(board, viewer, move) : []),
        [board, viewer, move],
    );
    const fills: [string, string] = [`${uid}-pearl`, `${uid}-onyx`];
    const opp: Seat = viewer === 0 ? 1 : 0;
    const svgRef = useRef<SVGSVGElement>(null);
    const grabRef = useRef<Grab | null>(null);
    const [drag, setDrag] = useState<Drag | null>(null);
    const picking = pick != null;

    const toBoardPoint = (event: { clientX: number; clientY: number }) => {
        const matrix = svgRef.current?.getScreenCTM()?.inverse();

        if (!matrix) {
            return null;
        }

        const point = new DOMPoint(
            event.clientX,
            event.clientY,
        ).matrixTransform(matrix);

        return { x: point.x, y: point.y };
    };

    const endGrab = () => {
        const grab = grabRef.current;
        grabRef.current = null;
        setDrag(null);

        if (grab && svgRef.current?.hasPointerCapture(grab.pointerId)) {
            svgRef.current.releasePointerCapture(grab.pointerId);
        }
    };

    useEffect(() => {
        if (!picking) {
            grabRef.current = null;
            setDrag(null);
        }
    }, [picking]);

    useEffect(() => {
        if (drag === null) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                endGrab();
            }
        };

        window.addEventListener('keydown', onKeyDown);

        return () => window.removeEventListener('keydown', onKeyDown);
    }, [drag === null]);

    const startGrab = (
        from: Step['from'],
        event: ReactPointerEvent<SVGGElement>,
    ) => {
        const stack = from === 'bar' ? ids.bar[viewer] : ids.points[from];
        const id = stack[stack.length - 1];
        const start = toBoardPoint(event);

        if (event.button !== 0 || id === undefined || !start) {
            return;
        }

        svgRef.current?.setPointerCapture(event.pointerId);
        grabRef.current = {
            from,
            id,
            start,
            pointerId: event.pointerId,
            dragging: false,
        };
    };

    const moveGrab = (event: ReactPointerEvent<SVGSVGElement>) => {
        const grab = grabRef.current;
        const at = toBoardPoint(event);

        if (!grab || !pick || !at || event.pointerId !== grab.pointerId) {
            return;
        }

        if (!grab.dragging) {
            if (travelled(grab.start, at) <= DRAG_THRESHOLD) {
                return;
            }

            grab.dragging = true;
            pick.onGrab(grab.from);
        }

        setDrag({
            from: grab.from,
            id: grab.id,
            at,
            hover: nearestTarget(at, pick.targets, viewer) as Step['to'] | null,
        });
    };

    const releaseGrab = (event: ReactPointerEvent<SVGSVGElement>) => {
        const grab = grabRef.current;
        const at = toBoardPoint(event);

        if (!grab || !pick || !at || event.pointerId !== grab.pointerId) {
            return;
        }

        const hover = nearestTarget(at, pick.targets, viewer) as
            | Step['to']
            | null;
        const outcome = dragOutcome(travelled(grab.start, at), hover);

        endGrab();

        if (outcome === 'click') {
            pick.onSelect(grab.from);
        } else if (outcome === 'drop' && hover !== null) {
            pick.onSelect(hover);
        }
    };

    const cubeY =
        !cube || cube.offered || cube.owner === null
            ? MID
            : cube.owner === viewer
              ? BOTTOM - 30
              : TOP + 30;
    const offeredRight =
        cube?.offered &&
        (cube.owner === viewer) !== (dice?.seat === cube.owner);
    const cubeX = cube?.offered
        ? offeredRight
            ? FIELD + 9 * PW + BAR
            : FIELD + 3 * PW
        : RAIL_X;

    return (
        <div
            className={cn('bgb', animate && 'bgb--animate')}
            data-testid="board"
        >
            <MotionConfig reducedMotion="user">
                <svg
                    ref={svgRef}
                    onPointerMove={moveGrab}
                    onPointerUp={releaseGrab}
                    onPointerCancel={endGrab}
                    viewBox={`0 0 ${W} ${H}`}
                    className="bgb__svg"
                    role="group"
                    aria-label="Board"
                >
                    <defs>
                        <linearGradient
                            id={`${uid}-rail`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop offset="0" className="bgb__stop-rail-hi" />
                            <stop offset="1" className="bgb__stop-rail-lo" />
                        </linearGradient>
                        <radialGradient
                            id={`${uid}-felt`}
                            cx="50%"
                            cy="40%"
                            r="80%"
                        >
                            <stop offset="0" className="bgb__stop-felt-hi" />
                            <stop offset="0.6" className="bgb__stop-felt" />
                            <stop offset="1" className="bgb__stop-felt-lo" />
                        </radialGradient>
                        <CheckerFills ids={fills} />
                        {TONES.map((tone) => (
                            <marker
                                key={tone}
                                id={`${uid}-head-${tone}`}
                                viewBox="0 0 10 10"
                                refX="5"
                                refY="5"
                                markerWidth="3.2"
                                markerHeight="3.2"
                                orient="auto-start-reverse"
                            >
                                <path
                                    d="M0,0 L10,5 L0,10 z"
                                    className={`bgb__head bgb__tone--${tone}`}
                                />
                            </marker>
                        ))}
                    </defs>
                    <rect
                        className="bgb__frame"
                        width={W}
                        height={H}
                        rx={18}
                        fill={`url(#${uid}-rail)`}
                    />
                    {[FIELD, FIELD + 6 * PW + BAR].map((x) => (
                        <rect
                            key={x}
                            className="bgb__felt"
                            x={x}
                            y={FY}
                            width={6 * PW}
                            height={H - 2 * FY}
                            fill={`url(#${uid}-felt)`}
                        />
                    ))}
                    <rect
                        className="bgb__bar"
                        x={FIELD + 6 * PW}
                        y={FY - 4}
                        width={BAR}
                        height={H - 2 * FY + 8}
                        rx={4}
                    />
                    <rect
                        className="bgb__recess"
                        x={FX + 4}
                        y={FY}
                        width={RAIL - 8}
                        height={H - 2 * FY}
                        rx={8}
                    />
                    <rect
                        className="bgb__recess"
                        x={TRAY_X + 4}
                        y={FY}
                        width={TRAY - 8}
                        height={PH + 16}
                        rx={8}
                    />
                    <rect
                        className="bgb__recess"
                        x={TRAY_X + 4}
                        y={H - FY - PH - 16}
                        width={TRAY - 8}
                        height={PH + 16}
                        rx={8}
                    />
                    {POINTS.map((i) => {
                        const { top, col, x, cx, pip } = slot(i, viewer);
                        const tip = top ? TOP + PH - 14 : BOTTOM - PH + 14;
                        const base = top ? FY : H - FY;
                        const tone =
                            (col + (top ? 0 : 1)) % 2 === 0 ? 'a' : 'b';

                        return (
                            <g key={i}>
                                <polygon
                                    className={`bgb__point bgb__point--${tone}`}
                                    points={`${x + 2},${base} ${x + PW - 2},${base} ${cx},${tip}`}
                                />
                                <text
                                    className="bgb__num"
                                    x={cx}
                                    y={top ? FY - 7 : H - 7}
                                >
                                    {pip}
                                </text>
                            </g>
                        );
                    })}
                    {pips && (
                        <g className="bgb__pips">
                            <text x={TRAY_X + TRAY / 2} y={MID - 16}>
                                <CountingNumber value={pips[opp]} />
                            </text>
                            <text
                                x={TRAY_X + TRAY / 2}
                                y={MID + 4}
                                className="bgb__pips-label"
                            >
                                pips
                            </text>
                            <text x={TRAY_X + TRAY / 2} y={MID + 28}>
                                <CountingNumber value={pips[viewer]} />
                            </text>
                        </g>
                    )}
                    {cube && (
                        <CubeMark
                            value={cube.offered ? cube.value * 2 : cube.value}
                            x={cubeX}
                            y={cubeY}
                            offered={cube.offered}
                            passed={cube.passed}
                            animate={animate}
                        />
                    )}
                    {cube?.passed && <PassedChip x={cubeX} y={cubeY + 46} />}
                    {dice && dice.values.length > 0 && (
                        <Dice
                            animate={animate && !dice.dimmed}
                            dimmed={dice.dimmed}
                            values={dice.values}
                            seat={dice.seat}
                            x={
                                dice.seat === viewer
                                    ? FIELD + 9 * PW + BAR
                                    : FIELD + 3 * PW
                            }
                            y={MID}
                        />
                    )}
                    <g className="bgb__checkers">
                        {[
                            ...ids.points.flatMap((stack, i) =>
                                stack.map((id, k) =>
                                    id === drag?.id ? null : (
                                        <Checker
                                            key={id}
                                            seat={seatOf(id)}
                                            fills={fills}
                                            animate={animate}
                                            {...checkerAt(i, viewer, k)}
                                        />
                                    ),
                                ),
                            ),
                            ...SEATS.flatMap((seat) => [
                                ...ids.bar[seat].map((id, k) =>
                                    id === drag?.id ? null : (
                                        <Checker
                                            key={id}
                                            seat={seat}
                                            fills={fills}
                                            animate={animate}
                                            {...barAt(seat === viewer, k)}
                                        />
                                    ),
                                ),
                                ...ids.off[seat].map((id, k) => (
                                    <Checker
                                        key={id}
                                        seat={seat}
                                        slab
                                        fills={fills}
                                        animate={animate}
                                        {...offAt(seat === viewer, k)}
                                    />
                                )),
                            ]),
                            drag && (
                                <Checker
                                    key={drag.id}
                                    seat={seatOf(drag.id)}
                                    fills={fills}
                                    animate={animate}
                                    dragging
                                    {...drag.at}
                                />
                            ),
                        ]}
                    </g>
                    {move && (
                        <g
                            data-test="board-arrows"
                            data-move={stepsNotation(move.seat, move.steps)}
                        >
                            {arrows.map((d, i) => (
                                <motion.path
                                    key={`${move.tone}-${d}`}
                                    d={d}
                                    className={`bgb__arrow bgb__tone--${move.tone}`}
                                    markerEnd={`url(#${uid}-head-${move.tone})`}
                                    initial={
                                        animate
                                            ? { pathLength: 0, opacity: 0 }
                                            : false
                                    }
                                    animate={{ pathLength: 1, opacity: 0.9 }}
                                    transition={{
                                        pathLength: {
                                            type: 'spring',
                                            stiffness: 120,
                                            damping: 20,
                                            delay: 0.15 + i * 0.08,
                                        },
                                        opacity: {
                                            duration: 0.15,
                                            delay: i * 0.08,
                                        },
                                    }}
                                />
                            ))}
                        </g>
                    )}
                    {pick && (
                        <PickLayer
                            pick={pick}
                            viewer={viewer}
                            hover={drag?.hover}
                            onGrabStart={startGrab}
                        />
                    )}
                    {POINTS.flatMap((i) =>
                        SEATS.map((seat) => {
                            const n = own(board, seat, i);

                            if (n <= 5) {
                                return null;
                            }

                            const at = checkerAt(i, viewer, 4);

                            return (
                                <text
                                    key={`${i}-${seat}`}
                                    className={`bgb__count bgb__count--${seat}`}
                                    x={at.x}
                                    y={at.y}
                                >
                                    {n}
                                </text>
                            );
                        }),
                    )}
                    {SEATS.map((seat) => {
                        const n = board.bar[seat];

                        if (n <= 3) {
                            return null;
                        }

                        const at = barAt(seat === viewer, 2);

                        return (
                            <text
                                key={`bar-${seat}`}
                                className={`bgb__count bgb__count--${seat}`}
                                x={at.x}
                                y={at.y}
                            >
                                {n}
                            </text>
                        );
                    })}
                </svg>
            </MotionConfig>
        </div>
    );
}
