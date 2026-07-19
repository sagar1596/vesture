// Stable integration surface for theme packages that need to layer extra CSS
// onto specific component classes (e.g. via vanilla-extract's `globalStyle`
// scoped under a theme class), beyond what token values alone can express.
//
// This is intentionally a curated allowlist, not a re-export of every
// component's internal `.css.ts` module — reaching into a component's file
// path directly is fragile and breaks silently on refactor. Only classes
// exported here are considered part of the theming contract.
//
// This surface is separate from the component prop API (`./index`). Renaming,
// removing, or changing the shape of anything exported from this file is a
// breaking change for any theme package that imports from
// "@vesture/react/theme-hooks".

export { button, variant } from "./components/Button/Button.css";
export { card, elevation } from "./components/Card/Card.css";
