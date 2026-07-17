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

Publishing authenticates via npm **Trusted Publishing** (OIDC) — GitHub
Actions proves its identity to npm directly for each run, no long-lived
`NPM_TOKEN` secret required. Each publishable package needs this repo +
workflow registered as a Trusted Publisher once, on npmjs.com:

1. Open the package's page → **Settings** → **Publishing access**
2. Add a Trusted Publisher:
   - Provider: **GitHub Actions**
   - Repository: `sagar1596/vesture`
   - Workflow filename: `release.yml`
   - Environment: leave blank (this workflow doesn't use a GitHub environment)
3. Repeat for `@vesture/tokens`, `@vesture/react`, and `@vesture/theme-retro`.

## License

MIT — see [LICENSE](LICENSE).
