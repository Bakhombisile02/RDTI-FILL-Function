# Repository Guidelines

## Project Structure & Module Organization
- `src/`: Core TypeScript for DOCX rendering (`docx.ts`), validation (`validation.ts`), text helpers (`text.ts`), and the CLI entry (`index.ts`). Types live in `types.ts`.
- `dist/`: Compiled JS from `pnpm build`; keep it in sync before running the Firebase emulator.
- `examples/`: Sample project payloads for manual runs.
- `output/`: Default folder for generated DOCX files when running the CLI; ignore in commits.
- `template/`: DOCX template file (`GA-Application-Template-Version-1.61-December-2024 (1).docx`).
- `functions/`: Firebase emulator wrapper (`functions/src/index.ts`) that calls the built module. Compiles to `functions/lib/` and writes DOCX to `functions/output/`.
- Root configs: `tsconfig.json` (strict ESM), `firebase.json` (emulator settings), `.firebaserc` (project alias).

## Build, Test, and Development Commands
- Install deps: `pnpm install` (root). For emulator deps: `pnpm --dir functions install`.
- Build library: `pnpm build` (runs `tsc`, outputs to `dist/`).
- Run CLI locally: `pnpm start -- examples/input.json ./output` (generates DOCX).
- Tests: `pnpm test` currently prints a placeholder; add real tests before relying on it.
- Emulator: ensure `pnpm build` is up to date, then `pnpm --dir functions serve` and POST to the printed function URL with a JSON array of projects.

## Coding Style & Naming Conventions
- TypeScript + ESM (`"type": "module"`); keep explicit `.js` extensions in imports after build.
- 2-space indentation, single quotes, trailing semicolons, `strict` mode on.
- Prefer small pure functions; keep IO (filesystem/HTTP) isolated in entry points.
- Names: PascalCase for types/interfaces, camelCase for functions/vars, concise file names (`docx.ts`, `text.ts`), kebab-case for paths if added.

## Testing Guidelines
- No automated tests yet; start with integration-style runs against `examples/input.json` and verify DOCX in `output/`.
- When adding tests, use `*.test.ts` (e.g., `src/__tests__/validation.test.ts`) and cover validation edge cases.
- Document any new fixtures in `examples/` and avoid committing generated DOCX files.

## Commit & Pull Request Guidelines
- Commits: imperative, scoped subject (e.g., `validation: simplify presence checks`, `docx: flatten payload structure`); keep them focused.
- PRs: include what/why, how you validated (`pnpm build`, emulator curl, etc.), and sample outputs if behavior changed. Link issues or tickets when available.
- Keep root module changes separate from emulator-only tweaks to simplify review.
