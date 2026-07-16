# Vesture

A themeable component library monorepo. Every component reads its visual
values from a shared design-token contract, so swapping the theme class on
`<html>` restyles the entire library — no component code changes required.
See [`packages/theme-retro`](packages/theme-retro) for a working example of a
second theme built on the same contract.

## Packages

| Package | Description |
| --- | --- |
| [`@vesture/tokens`](packages/tokens) | The design token contract (`vars`) plus a neutral default theme implementation |
| [`@vesture/react`](packages/react) | 26 React components — primitives, overlays, navigation, feedback, and DataGrid |
| [`@vesture/theme-retro`](packages/theme-retro) | A second theme implementing the same contract, proving it's genuinely swappable |
| `@vesture/playground` (private) | A kitchen-sink Vite app exercising every component against a real consumer setup |

## Development

```bash
npm install
npm run build       # turbo run build, all packages
npm run typecheck
npm run test
```

Run the component playground:

```bash
npm run dev -w @vesture/playground
```

Run Storybook (includes a theme-switcher toolbar):

```bash
npm run storybook -w @vesture/react
```

## Architecture notes

- **Styling**: [vanilla-extract](https://vanilla-extract.style/), zero-runtime CSS-in-TS. Every component's `*.css.ts` file reads exclusively from `vars.*` — no hardcoded colors, spacing, or typography.
- **Theming**: apply a theme's class to `document.documentElement` (or another true ancestor of `document.body`), not an inner `<div>` — several components (Modal, Tooltip, Popover, DropdownMenu, Toast) render through a React portal into `document.body`, and CSS custom properties only cascade down the DOM tree. See [`packages/react/README.md`](packages/react/README.md) for details.
- **Build**: [tsup](https://tsup.egoist.dev/) per package, ESM only, with the `@vanilla-extract/esbuild-plugin` so `.css.ts` files compile to real stylesheets at build time.
- **Monorepo orchestration**: [Turborepo](https://turbo.build/repo) with npm workspaces.

## Releasing

Versioning and changelogs are managed with [Changesets](https://github.com/changesets/changesets).

1. After making a change to a publishable package (`tokens`, `react`, or `theme-retro`), describe it:
   ```bash
   npm run changeset
   ```
   This prompts for which packages changed and whether it's a patch/minor/major bump, and writes a markdown file under `.changeset/`. Commit that file with your change.

2. On merge to `main`, the [release workflow](.github/workflows/release.yml) opens (or updates) a "Version Packages" pull request that applies the accumulated changesets — bumping versions and writing `CHANGELOG.md` entries.

3. Merging that PR triggers the same workflow to publish the updated packages to npm.

**Before the first real publish**, this repo still needs an `NPM_TOKEN`
repository secret (an npm automation token with publish access to the
`@vesture` org) for the release workflow to authenticate with.

## License

MIT — see [LICENSE](LICENSE).
