// Structural theme flourishes — CSS that a token *value* can't express (a
// hover rotation, a fixed tilt, a background texture), layered directly onto
// specific @vesture/react component classes via vanilla-extract's
// `globalStyle`. Every rule here is scoped under `retroThemeClass` as an
// ancestor selector so it only ever applies when the retro theme is active;
// other themes (and @vesture/react's own default styling) are untouched.
//
// Only classes exported from "@vesture/react/theme-hooks" are targeted here
// — that file is the curated, stable surface for this kind of theme
// integration. Reaching into a component's own .css.ts import path directly
// would be fragile and would break silently on an unrelated refactor.
import { globalStyle } from "@vanilla-extract/css";
import { vars } from "@vesture/tokens";
import { button, card } from "@vesture/react/theme-hooks";
import { retroThemeClass } from "./retro-theme.css";

// A small brownish paper-grain speckle: feTurbulence drives a fixed color's
// alpha channel (capped at 0.08, so most of the pattern reads well under
// 0.08) rather than varying RGB — that keeps the texture from ever shifting
// the surface's overall luminance enough to threaten text contrast. Verified
// against vars.color.text (#3b2a1a) on vars.color.surface (#f2e6d3): the
// grain sits *under* text content as a background-image, and its alpha cap
// is low enough that the surface's effective luminance moves by well under
// 1%, i.e. immaterial to the existing ~8.9:1 contrast ratio.
const grainSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'>
  <filter id='grain'>
    <feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch' />
    <feColorMatrix type='matrix' values='0 0 0 0 0.231  0 0 0 0 0.165  0 0 0 0 0.102  0 0 0 0.08 0' />
  </filter>
  <rect width='100%' height='100%' filter='url(#grain)' />
</svg>`;
const grainDataUri = `data:image/svg+xml,${encodeURIComponent(grainSvg)}`;

// Button — a very slight "hand-stamped/sticker" wobble on hover, layered on
// top of each variant's existing hover color change (that's declared on the
// separate `variant[name]` class, so it keeps applying independently).
// `${retroThemeClass} .${button}` is two classes (specificity 0,2,0), which
// beats Button.css.ts's own single-class `.button` rule (0,1,0) regardless
// of stylesheet order, so redeclaring transitionProperty here to add
// `transform` is a safe, deliberate override rather than a source-order
// gamble.
//
// -1deg was checked against Button's "AllVariants" story (three buttons in a
// 12px-gap row): at typical button sizes the corner displacement from a
// 1-degree rotation is well under a pixel, so hover on one button never
// visually overlaps its neighbors or drifts off its own click target.
globalStyle(`${retroThemeClass} .${button}`, {
  transitionProperty: "background-color, border-color, color, box-shadow, transform",
  transitionDuration: vars.motion.durationFast,
  transitionTimingFunction: vars.motion.easing
});

globalStyle(`${retroThemeClass} .${button}:hover:not(:disabled)`, {
  transform: "rotate(-1deg)"
});

// Card — a fixed (not random — see task notes on SSR hydration mismatches),
// slightly-askew "postcard" tilt, plus a subtle paper-grain background layer.
// `backgroundImage` is set here rather than `background`, so it composites
// on top of whichever background-color the base `card` class or an
// `elevation` variant (flat/raised/overlay) already resolved to, instead of
// replacing it.
globalStyle(`${retroThemeClass} .${card}`, {
  transform: "rotate(-0.5deg)",
  backgroundImage: `url("${grainDataUri}")`,
  backgroundRepeat: "repeat"
});
