# Vesture — agent notes

Turborepo monorepo. See [`README.md`](README.md) for package overview, dev
commands, and the Changesets release process — this file covers conventions
an agent needs to follow when writing code here, since they aren't written
down anywhere else.

## Commands

```bash
npm run build -w @vesture/react       # tsup, must pass before a component change is "done"
npm run test -w @vesture/react        # vitest run
npx tsc --noEmit -p tsconfig.json     # from packages/react — this repo's "lint"
npm run dev -w @vesture/playground    # exercise components in a real Vite app
npm run storybook -w @vesture/react
```

## Adding a new component to `@vesture/react`

There is no shared `hooks/` or `utils/` directory — every component folder
is self-contained, and controlled/uncontrolled boilerplate is duplicated
per-component rather than extracted. Follow that convention rather than
introducing a shared hook, unless asked to refactor.

1. Create `packages/react/src/components/<Name>/` with:
   - `<Name>.tsx` — the component + its exported `<Name>Props` interface (or split into `types.ts` if there's real domain typing beyond props, e.g. `Slider/types.ts`)
   - `<Name>.css.ts` — vanilla-extract styles, `style()` from `@vanilla-extract/css`, every value read from `vars.*` in `@vesture/tokens` — never a hardcoded color/space/radius/font
   - `<Name>.test.tsx` — Vitest + Testing Library, colocated
   - `<Name>.stories.tsx` — Storybook, `title: "Components/<Name>"`
   - `index.ts` — `export { Name } from "./Name"; export type { NameProps } from "./Name";`
2. Wire it into `packages/react/src/index.ts` (component + its exported types), in the same one-block-per-component style already there.
3. Run build + test + typecheck (commands above) before calling it done.

### Prop conventions

- Controlled/uncontrolled triad: `value` / `defaultValue` / `onChange`, resolved as `controlledValue !== undefined ? controlledValue : uncontrolledValue` (or `??` when the fallback is a plain boolean, e.g. `open`/`onOpenChange`). See `DatePicker.tsx` for the canonical shape.
- Simple native-element wrappers (`Input`, `Select`, `Checkbox`, ...) are `forwardRef` around the native element, spread `...rest: <Native>HTMLAttributes<...>`, add `invalid?: boolean` → `aria-invalid`.
- Complex stateful overlay components (`DatePicker`, `DropdownMenu`, `Popover`, `Combobox`) are plain `export function Name(props)` — no `forwardRef` — since they own `refs.setReference` via floating-ui internally.
- `className` merges as `[ownClass, className].filter(Boolean).join(" ")`.

### Overlays / keyboard nav

Everything interactive/floating is built on `@floating-ui/react`
(`useFloating`, `offset`/`flip`/`shift`, `useInteractions`, `FloatingPortal`,
`FloatingFocusManager`). Pick the closest existing pattern rather than
inventing a new one:

- **Dropdown/listbox with arrow-key roving selection** (`DropdownMenu`, `Combobox`): `useListNavigation` (or manual index tracking for data-driven lists like Combobox's filtered options) + a small React context to pass `activeIndex`/`getItemProps` down to item components without prop drilling (see `DropdownMenu/MenuContext.ts`).
- **Text input + calendar/listbox popover** (`DatePicker`, `Combobox`): `useDismiss` + `useRole(context, { role: "dialog" | "listbox" })`, non-modal `FloatingFocusManager`, `returnFocus` to the trigger input.
- **Manual grid roving-tabindex** (`Calendar`): own `ArrowLeft/Right/Up/Down/Home/End/PageUp/PageDown` handling, ref map, `tabIndex={0}` only on the currently-roving cell.
- **Draggable control with keyboard steps** (`Slider`): pointer events for drag + a manual `ArrowLeft/Right/Up/Down/Home/End/PageUp/PageDown` switch, `role="slider"`. **Gotcha**: if you `event.preventDefault()` in a `pointerdown` handler (to block text selection during drag), the browser's default click-to-focus is also blocked — call `.focus()` explicitly on the target element in that same handler, or the control becomes keyboard-inert after a click/drag. Hit this exact bug building `Slider`; see its `startDrag` for the fix (a ref map to the actual thumb DOM node, not `event.currentTarget`, since track-originated drags and thumb-originated drags don't share a `currentTarget`).

### Component catalog

Every component in `packages/react/src/components/`, grouped by the pattern
it follows (see "Prop conventions" and "Overlays / keyboard nav" above for
what each pattern means). When adding a new component, find its closest
analog here rather than inventing a new shape.

**Native-element wrappers** (`forwardRef`, spread `...rest: <Native>HTMLAttributes`, `invalid?` → `aria-invalid`):
`Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch`, `NumberInput`,
`Label`, `Button`, `Card`, `Badge`, `Avatar`, `Divider`, `Stack`.

**Controlled/uncontrolled stateful primitives** (no overlay, plain function component unless noted): `Rating`, `Progress`, `Pagination`, `Tabs`, `Accordion`, `Skeleton`.

**Overlay / floating-ui components** (plain function, own `refs.setReference`): `Modal`, `Tooltip`, `Popover`, `DropdownMenu`, `Toast`, `Drawer`, `CommandPalette`, `DatePicker`, `DateRangePicker`, `Combobox`. See "Overlays / keyboard nav" above for which sub-pattern (dropdown-nav vs. input+popover) each follows.

**Manual keyboard-nav / drag components** (no floating-ui): `Calendar` (grid roving-tabindex), `Slider` (pointer-drag + arrow-key steps), `Scheduler` (Pointer Events drag — the technique `KanbanBoard` phase 2 will reuse).

**Virtualized / windowed data components**: `TreeView` (flatten-and-window a dynamic tree — see `TreeView.tsx`'s `flatNodes`/`visibleFlatNodes`), `DataGrid` (`forwardRef<DataGridHandle<T>, ...>`, column pinning + resizing + grouping + Excel export, same flatten-and-window approach over `flatEntries`).

**Bespoke / domain-specific**: `QueryBuilder` (recursive rule-group tree → `queryToString`), `RichTextEditor` (contentEditable + `DEFAULT_TOOLBAR`, sanitizes via `sanitize.ts`), `SignaturePad` (`forwardRef<SignaturePadHandle, ...>`, canvas-based), `Breadcrumbs`, `Alert`, `Spinner`, `charts/` (`LineChart`, `BarChart`, `AreaChart`, `PieChart`, each with a plain and an `Interactive*` variant, tokens via `vars.chart.*`).

**Multi-column / card-collection layouts**: `KanbanBoard` (columns of cards; add/remove and now full pointer + keyboard drag-and-drop via `onColumnsChange` — see "Recent context" below). Read this alongside `DataGrid`'s column layout and `TreeView`'s windowing before building another data-collection component — `KanbanBoard` deliberately skipped virtualization (checked again in phase 2, same conclusion) since plain rendering held up fine through 60 cards in one column; revisit only if a future column count is an order of magnitude larger.

**Graph / node-edge layouts**: `Diagram` (direct coordinate positioning, not data-domain
mapping like `charts/` — static SVG rendering plus an `InteractiveDiagram` with pan/zoom, no
node dragging yet; see "Recent context" below for phase 2 scope). Skipped windowing at this
node count for the same reason `KanbanBoard` did — see "Recent context" for the measured finding.

### Theming

Portal-rendered components (`Modal`, `Tooltip`, `Popover`, `DropdownMenu`,
`Toast`, and now `Combobox`'s listbox) mount into `document.body`. See
[`packages/react/README.md`](packages/react/README.md) for why the theme
class must go on `<html>`/`<body>`, not an inner `<div>`.

## Verifying a change end-to-end

Typecheck + unit tests are necessary but not sufficient for UI work. Before
calling a component change done:

1. `npm run build -w @vesture/react` (tsup + dts)
2. `npm run test -w @vesture/react`
3. Rebuild and drive `apps/playground` in a real browser (`npm run dev -w @vesture/playground`) — this caught the Slider focus bug above, which unit tests alone didn't surface because jsdom doesn't reproduce the browser's implicit focus-on-click behavior faithfully enough to notice it being suppressed.

## Publishing / downstream consumers

`vesture-site` (a separate repo, sibling directory) consumes the **published
npm package**, not this monorepo directly — a local change here isn't live
anywhere until a changeset is written, merged, and published (see README
"Releasing"). If you need to preview an unpublished change in `vesture-site`,
`npm pack` this package and install the tarball there temporarily — don't
`file:`-link the directory directly, Turbopack refuses to resolve symlinks
that point outside the site's project root.

## Recent context

- **2026-07-28**: Added `Diagram` phase 2 — node dragging (reposition), connection drawing
  (pointer handles + keyboard), and node/edge deletion, on top of phase 1's pan/zoom/select-only
  `InteractiveDiagram`. All gated behind a new `editable` prop (default `false`, so existing
  consumers see zero behavior change) — reuses Scheduler/KanbanBoard's exact Pointer Events
  technique (`setPointerCapture` in try/catch, a `moved` flag distinguishing a drag from a plain
  click via `suppressClickRef`, `aria-live` announcements) rather than introducing a fourth drag
  mechanism. Node drag recomputes the full layout (`buildDiagramLayout`, including every
  connected edge's anchor points) on each pointermove rather than a partial/connected-edges-only
  update — phase 1's LargeGraph finding (36 nodes/~60 edges, no perf issue) meant this simpler
  approach didn't need the more complex targeted update the task description flagged as a
  fallback; revisit only if a future graph is an order of magnitude larger.
  Connection drawing: hover/selection reveals four cardinal handles
  (`getCardinalHandlePoints` in `Diagram.render.ts` — shape-agnostic, since a rectangle's
  bounding-box midpoints, an ellipse's axis endpoints, and a diamond's own vertices are all
  exactly the same four coordinates), drag from a handle to a target node hit-tested via
  `findNodeAtPoint`/`isPointInNode`, connects `source`→target-node-id (not to a specific handle,
  reusing phase 1's anchor-point calculation to pick the visual side automatically). Keyboard
  equivalent: `C` enters connect mode, `Tab`/`Shift+Tab` cycles the prospective target,
  `Enter`/`Escape` confirms/cancels — chose `C` after checking it doesn't collide with
  Delete/Backspace/arrow-key bindings already in this component.
  Deletion: `onNodeDelete?: (nodeId, orphanedEdgeIds: string[])` — Diagram only reports deletion
  intent (via `findConnectedEdgeIds`), since it doesn't own combined nodes+edges state; the
  consumer must remove both the node and the orphaned edges together in one update (documented on
  the prop itself, demonstrated in the `DeleteNodeAndOrphanedEdges` story).
  Two real bugs found only by driving this in a real browser (both invisible to unit tests, which
  use jsdom and don't reproduce real focus/paint behavior):
  1. Clicking a focusable SVG element (`<g tabIndex={0}>`) does **not** move DOM focus there the
     way clicking a focusable HTML element does — so Delete/arrow-key/`C` shortcuts silently
     never fired after a mouse click, only after an explicit Tab into the element. Fixed by
     calling `event.currentTarget.focus()` explicitly in the node's and edge's pointerdown/click
     handlers (same category of gotcha as the `Slider` focus bug logged below, different root
     cause: an SVG-specific browser behavior rather than a blocked default action).
  2. A dragged node moved correctly but became invisible when a screenshot was taken right after
     — turned out to be a false alarm from testing methodology (the target position was simply
     below the story's visible canvas height, clipped by the SVG's default viewport clipping),
     not a rendering bug; worth remembering when eyeballing drag results in a small story canvas.
- **2026-07-28**: Added `Diagram` phase 1 — static node/edge rendering
  (`Diagram.tsx`) plus an `InteractiveDiagram` (`Diagram.interactive.tsx`)
  with pan (drag on empty canvas, not on a node) and wheel/pinch zoom, no
  editing yet (node dragging, drawing new connections — phase 2). Follows
  `LineChart`'s static/interactive split: pure geometry in `Diagram.render.ts`
  (`getAnchorPoint` computes which side of a node's boundary an edge connects
  to, based on shape and the direction to the other node's center — rectangle
  uses a min-scale line/box intersection, circle treats width/height as an
  ellipse, diamond uses the `|dx|/hw + |dy|/hh = 1` boundary condition; curved
  edges get a quadratic-bezier control-point offset that fans out by each
  edge's index within its unordered node-pair group, so multiple edges
  between the same two nodes visually separate rather than overlap).
  `InteractiveDiagram` re-derives its own layout via `buildDiagramLayout`
  rather than wrapping the static `Diagram` component with a CSS transform —
  wrapping was tried first but doesn't work cleanly because the static
  component's own `viewBox` already applies a browser-managed scale/offset
  independent of any pan/zoom transform layered on top, so hit-testing and
  the pan/zoom math would need to invert two coordinate systems at once.
  Direct re-render duplicates the small `NodeShape`/`EdgeLine` renderers
  between the two files, which is consistent with this repo's
  no-shared-hooks convention. One real bug caught only by driving it in a
  browser (not by unit tests, which use jsdom's stubbed layout): the pan
  background `<rect>` had no explicit `fill`, so it rendered solid black —
  SVG shapes default to a black fill when unspecified, unlike CSS elements'
  transparent default; fixed via `fill: "transparent"` in `Diagram.css.ts`'s
  `canvas` class. Also found that `box-shadow` (the `vars.shadow.focus` token
  used for focus rings elsewhere in the library) does not reliably render on
  SVG shape elements in real browsers despite working fine as a CSS value —
  the selected-node ring is instead a second stroked shape (same geometry,
  6px larger) drawn behind the node using `vars.color.focusRing` directly.
  LargeGraph story finding (36 nodes / ~60 edges, matching `KanbanBoard`'s
  "check scale before adding windowing" precedent): pan-drag and wheel-zoom
  both stayed visually smooth in manual browser testing, with no windowing in
  `Diagram.render.ts`/`Diagram.interactive.tsx` — revisit only if a future
  graph is an order of magnitude larger, same threshold `KanbanBoard` used.
- **2026-07-28**: Added `KanbanBoard` phase 2 — pointer drag-and-drop (card
  reorder within a column, card move across columns, column reorder) plus a
  required keyboard-accessible alternative, on top of phase 1's static
  structure. Reused `Scheduler`'s exact Pointer Events technique rather than
  a second drag mechanism: `onPointerDown` calls `setPointerCapture` (wrapped
  in try/catch — not implemented in every test/DOM env) + `.focus()`, a
  `moved` flag on drag state distinguishes a real drag from a plain click
  (pointerup with `moved: false` fires `onCardClick`/nothing instead of
  reordering, via the same `suppressClickRef` double-fire guard Scheduler
  uses), and an `aria-live="polite"` region (`visuallyHidden` class,
  identical to `Scheduler.css.ts`'s) announces every move. All drag/keyboard
  reordering is gated on `onColumnsChange` being passed — no prop, no
  interaction, consistent with phase 1's gating of the remove affordance.
  Geometry math (`kanban-dnd.ts`, mirroring `scheduler-layout.ts`'s
  pure-function-for-testability split from `Scheduler.tsx`'s DOM/ref
  plumbing): `findHoveredIndex` (which column the pointer is over, by X,
  clamped to first/last), `findInsertIndex` (insertion slot by comparing a
  pointer coordinate against each candidate's rect midpoint — used both for
  card-within-column-Y and column-reorder-X), `moveCard`/`reorderColumns`
  (pure array-splice reorder), and `buildColumnRenderItems` (interleaves an
  indicator marker into a card or column list at the drop index — reused for
  both card lists and the top-level column row, since both are "insert a
  marker into an ordered list of `{id}` items" problems). One subtlety worth
  reading before touching that file: the dragged item's own dimmed
  placeholder stays in the walk (per the "dim in place" requirement) rather
  than being filtered out, so the indicator-placement check must skip the
  dragged item's own iteration — otherwise the marker lands one slot too
  early, immediately before the placeholder instead of after it (caught by
  `kanban-dnd.test.ts`, fixed before this was committed).
  `wipLimit` stays informational through a drag too — hovering a card over a
  column that would exceed its limit flips that column's warning treatment
  on (`data-wip-warning` on the column, `warning` Badge variant), computed
  from a "projected" count, but the drop is never blocked.
  Re-checked the phase 1 virtualization question before adding drag
  mechanics: still unnecessary at current scale (60 cards/column), so
  `kanban-dnd.ts` has no windowing — if that changes, the windowing would
  need to interact with drag geometry (measuring only currently-mounted
  cards' rects), which is real added complexity phase 2 avoided by not
  needing it yet.
- **2026-07-28**: Fixed a date-dependent flaky test in
  `DateRangePicker.test.tsx` — two tests picked a second click target as
  `today ± N days` without checking it stayed in the currently displayed
  month. `Calendar.tsx`'s `handleDayClick` treats a click on an out-of-month
  overflow day as "navigate to that month," not "select the date" (by
  design, for the single-date `Calendar`/`DatePicker` case), so when the
  offset crossed a month boundary the click silently just paged the calendar
  instead of firing `onChange`. Fixed by explicitly clicking "Next
  month"/"Previous month" in the test first when the target date's
  month/year differs from `today`'s, rather than assuming the overflow row
  is clickable-as-selection.
- **2026-07-18**: Added `NumberInput`, `Slider` (single or `[start, end]`
  range via a tuple `value`), and `Combobox` (single/multi-select typeahead,
  built on the `DropdownMenu` + `DatePicker` patterns above). These are the
  best current reference examples of the conventions in this file — read
  their source before adding another component.
- **2026-07-18**: Added Excel export to `DataGrid`. `xlsx` (SheetJS) is a
  dependency but only ever `import()`-ed dynamically inside `exportToExcel`,
  so it stays out of the base bundle for consumers who don't export.
  `DataGrid` is now `forwardRef<DataGridHandle<T>, DataGridProps<T>>` (was a
  plain function component) — exposes `exportToExcel({ filename?, sheetName?
  })` via `useImperativeHandle`, built from whatever the final post-filter/
  sort derived array is at call time (`sortedData` as of this writing), not
  the raw `data` prop. Per-column export value resolution order:
  `column.exportValue` → `column.accessor` → raw `row[column.key]` —
  deliberately not `column.render`, since that returns a `ReactNode`. Note:
  npm's published `xlsx` package is stuck at the stale 0.18.5 release with
  unpatched advisories (prototype pollution, ReDoS); SheetJS only ships fixed
  builds through their own CDN, so the dependency is pinned to a tarball URL
  — `"xlsx": "https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz"` — instead
  of a semver range. When bumping, get the new tarball URL from
  https://cdn.sheetjs.com and re-pin explicitly rather than switching back to
  the npm registry name.
