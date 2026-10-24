# backgammon-ui

React backgammon board and a set of UI primitives. The board is a responsive SVG with drag and click move input, dice, doubling cube, pip counts, move arrows, and animated checkers. The primitives are Radix-based, Tailwind-styled components.

## Install

```sh
npm install backgammon-ui
```

Peer dependencies: `react` and `react-dom` 18 or 19. You need a bundler. The package ships extensionless ESM and isn't meant to be imported directly by Node.

## Setup

The components use Tailwind CSS v4 classes and CSS variables. In your main stylesheet:

```css
@import 'tailwindcss';
@import 'backgammon-ui/styles/theme.css';
@import 'backgammon-ui/styles/board.css';

@source '../node_modules/backgammon-ui/dist';
```

`theme.css` defines the color tokens (light, plus a `.dark` class variant). `board.css` styles the board and defines the `--board-*` variables if you want to retheme the felt, points, or rails. Adjust the `@source` path to match your project layout.

## Usage

```tsx
import { Board, startBoard } from 'backgammon-ui';

export function Game() {
    return (
        <Board
            board={startBoard()}
            viewer={0}
            dice={{ values: [3, 1], seat: 0 }}
            cube={{ value: 2, owner: null, offered: false }}
        />
    );
}
```

### Board props

| Prop | Type | Notes |
| --- | --- | --- |
| `board` | `BoardState` | Required. Position to draw. |
| `viewer` | `0 \| 1` | Required. Whose side sits at the bottom. |
| `dice` | `{ values, seat, dimmed? }` | Dice on the board. |
| `cube` | `{ value, owner, offered, passed? }` | Doubling cube state. |
| `pips` | `[number, number]` | Pip counts to display. See `pipCount`. |
| `move` | `{ seat, steps, tone }` | Draws arrows for a played move. `tone` is one of `played`, `good`, `doubtful`, `error`, `blunder`, `best`. |
| `pick` | `{ selectable, selected, targets, onSelect, onGrab }` | Turns on move input. Supports click and drag. |
| `stacks` | `Stacks` | Stable checker ids. Computed for you if omitted. |
| `animate` | `boolean` | Animate checker movement. Default `false`. |

Wrap the tree in `MotionModeContext.Provider` with `'full'`, `'quick'`, or `'static'` to control animation globally.

### Board model

`BoardState` is `{ points: number[24], bar: [n, n], off: [n, n] }`. Positive point values are seat 0's checkers, negative are seat 1's. A `Step` is `{ from: number | 'bar', to: number | 'off' }`.

Helpers: `startBoard`, `pipCount`, `pipOf`, `idx`, `own`, `other`, `sign`, `stepsNotation`, `stacksOf`, `moveStacks`, `reconcileStacks`.

### UI primitives

`Alert`, `Avatar`, `Badge`, `Breadcrumb`, `Button`, `Card`, `Checkbox`, `Collapsible`, `Dialog`, `DropdownMenu`, `Input`, `Label`, `SegmentedControl`, `Select`, `Separator`, `Sheet`, `Skeleton`, `Spinner`, `Table`, `Toggle`, `ToggleGroup`, `Tooltip`, `Icon`, `BoardDock`, `CountingNumber`, and the `cn` class helper.

## Development

```sh
npm install
npm run typecheck
npm test
npm run build
```

## Releasing

1. Bump `version` in `package.json` and update `CHANGELOG.md`.
2. Commit, then `git tag vX.Y.Z` and push the tag.
3. Run `npm publish`. The `prepublishOnly` script runs typecheck, tests, and build first.
4. Create a GitHub release for the tag.

## License

MIT
