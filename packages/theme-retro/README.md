# @vesture/theme-retro

A warm, terracotta-and-serif theme implementing the [`@vesture/tokens`](../tokens)
contract. It exists to prove the theming system actually works for swapping
brands — every `@vesture/react` component reads from `vars.*`, never fixed
values, so this package needs nothing but token values to produce a
completely different look.

## Usage

```ts
import "@vesture/theme-retro/styles.css";
import { retroThemeClass } from "@vesture/theme-retro";

document.documentElement.classList.add(retroThemeClass);
```

Apply the class to `document.documentElement` (or another true ancestor of
`document.body`), not an inner `<div>` — see the
[`@vesture/react` README](../react/README.md#applying-the-theme-class-to-html-not-an-inner-div)
for why this matters when components render through portals (Modal, Tooltip,
Popover, DropdownMenu, Toast).

## What's different from the default theme

- Warm cream background and terracotta primary color instead of neutral
  black/white
- Serif display font (`Georgia`) for headings
- Larger border radius and heavier border widths for a chunkier look
- A bouncier motion easing curve

Every other structural decision — spacing scale, font size scale, line
heights — matches the default theme, since components rely on those values
being consistent across themes for layout to hold.
