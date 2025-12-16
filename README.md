# RDTI FILL Function

Type-safe, standalone module to generate RDTI General Approval (GA) DOCX files (template v1.61, 10 Dec 2024) from Radley project JSON. No existing repo files are modified.

## Quick Start

### Installation

```bash
# Install root dependencies
pnpm install

# Build the module
pnpm build
```

### Run Standalone CLI

```bash
pnpm start -- examples/input.json
```

Output: DOCX files saved to `./output/RDTI_GA_{uid}.docx`

### Run with Firebase Emulator

**Terminal 1 - Install and build functions:**
```bash
cd functions
pnpm install
pnpm build
cd ..
```

**Terminal 2 - Start emulator:**
```bash
pnpm --dir functions serve
```

**Terminal 3 - Test the function:**
```bash
curl -X POST http://localhost:5001/demo-rdti/us-central1/generateGaDocx \
  -H "Content-Type: application/json" \
  --data @examples/input.json
```

Output: DOCX files saved to `functions/output/`

---

## Input / Output

**Input:** JSON array of projects (see `src/types.ts`)

Required fields:
- `uid`, `name`, `description`, `startDate`, `endDate`, `companyId`, `anzsrc`
- `projectOwner` with `firstName`, `lastName`, `role`, `email`, `phone`, `contactPhoneCountry`, `contactPhoneType`
- `coreActivities[]` - single activity with `name`, `description`, `startDate`, `endDate`, `uncertainties`, `approach`, `intentions`
- `supportingActivities[]` - each with `name`, `description`, `startDate`, `endDate`, `definiition`

**Output:** `{ status, docx_path, docx_paths[], errors[] }`

## Behavior

- Strict validation per `src/validation.ts`: missing/invalid required fields produce structured error per project
- Field limits handled upstream - no truncation occurs here
- Batch-safe: processes each project independently; one failure does not block others
- Template uses flat payload per project (no `{#projects}` loop)

## Stack

- TypeScript (isolated module)
- DOCX: `docxtemplater` + `pizzip`
- No headless browser needed
