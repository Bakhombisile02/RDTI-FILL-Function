# RDTI FILL Function

Type-safe, standalone module to generate RDTI General Approval (GA) DOCX files (template v1.61, 10 Dec 2024) from Radley project JSON. No existing repo files are modified.

## Input → Output
- Input: JSON array of projects (see `src/types.ts`). Required: `uid`, `name`, `description`, `startDate`, `endDate`, `companyId`, `anzsrc`, `projectOwner{ firstName,lastName,role,email,phone,contactPhoneCountry,contactPhoneType }`, `coreActivities[]` (single activity with name, description, startDate, endDate, uncertainties, approach, intentions), `supportingActivities[]` (name, description, startDate, endDate, definiition).
- Output: `{ status, docx_path, docx_paths[], errors[] }`. DOCX files saved as `outputDir/RDTI_GA_{uid}.docx` (default `./output`).

## Behavior & validation
- Strict validation per `src/validation.ts`: missing/invalid required fields → structured error per project; project marked `error` and no DOCX generated.
- Field limits are handled upstream before input reaches this function—no truncation occurs here.
- Batch-safe: processes each project independently; one project's failure does not block others.
- Template uses flat payload per project (no `{#projects}` loop); single core activity as flat fields (`coreActivityName`, etc.); supporting activities via `{#supportingActivities}` loop.

## Stack
- Language: TypeScript (isolated module). DOCX: `docxtemplater` + `pizzip`. No headless browser needed.

## Usage (standalone CLI)
- From this folder: `pnpm install` to fetch deps.
- Run sample: `pnpm start -- examples/input.json` (writes DOCX to `./output`).

## Firebase emulator (optional, functions v2 HTTP)
- Build the module so functions can import compiled JS: `pnpm build`.
- Install emulator deps: `cd functions && pnpm install`.
- Start emulator: `pnpm --dir functions serve` (uses `firebase.json` in this folder, functions on port 5001, project `demo-rdti`).
- Call the emulated HTTP function:
	- `curl -X POST http://localhost:5001/demo-rdti/us-central1/generateGaDocx -H "Content-Type: application/json" --data @../examples/input.json`
- DOCX files are written to `RDTI FILL Function/functions/output` by default.
