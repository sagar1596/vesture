# @vesture/react

React components for Vesture, styled with vanilla-extract and themed via
[`@vesture/tokens`](../tokens).

## Setup

```ts
import "@vesture/tokens/styles.css";
import "@vesture/react/styles.css";
import { defaultThemeClass } from "@vesture/react";

document.documentElement.classList.add(defaultThemeClass);
```

## Applying the theme class to `<html>`, not an inner `<div>`

Apply the theme class to `document.documentElement` (or `<body>`), **not** to
an inner wrapper `<div>` in your component tree. Several components —
`Modal`, `Tooltip`, `Popover`, `DropdownMenu`, and `Toast` — render their
content through a React portal into `document.body`, outside of wherever your
app's React tree happens to sit in the DOM.

CSS custom properties (the mechanism the token contract is built on) only
cascade down the DOM tree. If the theme class is applied to a `<div>` inside
your app rather than a true ancestor of `document.body`, portal-rendered
content falls outside that subtree and every `vars.*` reference resolves to
nothing — the overlay renders completely unstyled.

```tsx
// Wrong — portals (Modal, Tooltip, Popover, DropdownMenu, Toast) won't
// inherit the theme, since document.body is a sibling of this div, not
// a descendant.
function App() {
  return <div className={defaultThemeClass}>{/* ... */}</div>;
}
```

```ts
// Right — <html> is an ancestor of document.body, so every portal
// (which always mounts into document.body) inherits the theme correctly.
document.documentElement.classList.add(defaultThemeClass);
```

If you need multiple simultaneous themes on one page (vanilla-extract
supports this), keep the theme class on each themed subtree's root `<div>`
as usual, but pass an explicit portal container to the overlay component
(e.g. `FloatingPortal`'s `root` prop) that lives inside that themed subtree
rather than relying on the `document.body` default.
