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
