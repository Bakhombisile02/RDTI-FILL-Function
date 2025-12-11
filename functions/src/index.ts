import { onRequest } from 'firebase-functions/v2/https';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateRDTIGADocx } from '../../dist/index.js';
import type { ProjectInput, ProjectsPayload } from '../../dist/types.js';

const templatePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'template',
  'GA-Application-Template-Version-1.61-December-2024 (1).docx',
);

// HTTP function to generate DOCX via Firebase Emulator.
export const generateGaDocx = onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST with JSON body of projects[] or {projects: []}' });
    return;
  }

  try {
    const body = req.body as ProjectInput[] | ProjectsPayload;
    // Use root-level output folder (same as CLI)
    const outputDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'output');
    const result = await generateRDTIGADocx(body, { outputDir, templatePath });
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});
