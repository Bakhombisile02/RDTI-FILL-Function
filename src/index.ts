import fs from 'fs';
import path from 'path';
import { renderDocxForProjects, defaultDocxTemplatePath } from './docx.js';
import { normalizeProjectsInput } from './projects.js';
import { validateProject } from './validation.js';
import type {
  DocxGenerateOptions,
  DocxGenerateResult,
  ProjectInput,
  ProjectsPayload,
  ValidatedProject,
} from './types.js';

const defaultOutputDir = './output';

export async function generateRDTIGADocx(
  projectsInput: ProjectInput[] | ProjectsPayload,
  options?: DocxGenerateOptions,
): Promise<DocxGenerateResult> {
  const projects = normalizeProjectsInput(projectsInput);
  const outputDir = options?.outputDir ?? defaultOutputDir;
  const validProjects: ValidatedProject[] = [];
  const errors: string[] = [];

  for (const project of projects) {
    const { project: validated, issues } = validateProject(project);
    const projectErrors = issues.filter((i) => i.type === 'error').map((i) => i.message);
    if (!validated || projectErrors.length > 0) {
      const projectId = project.uid ?? project.projectName ?? project.name ?? 'unknown';
      errors.push(...projectErrors.map((err) => `${projectId}: ${err}`));
      continue;
    }
    validProjects.push(validated);
  }

  if (errors.length > 0 || validProjects.length === 0) {
    return {
      status: 'error',
      docx_path: null,
      docx_paths: [],
      errors: errors.length > 0 ? errors : ['No valid projects to render'],
    };
  }

  const renderResult = await renderDocxForProjects(validProjects, {
    ...options,
    outputDir,
    templatePath: options?.templatePath ?? defaultDocxTemplatePath,
  });

  // Collect any render errors
  const allErrors = [...errors, ...renderResult.errors];

  return {
    status: renderResult.outputPaths.length > 0 ? 'success' : 'error',
    docx_path: renderResult.outputPaths[0] ?? null,
    docx_paths: renderResult.outputPaths,
    errors: allErrors,
  };
}

// Simple CLI for manual runs: ts-node src/index.ts ./examples/input.json [outputDir]
const isCli = process.argv[1] && process.argv[1].endsWith('index.js') && !process.env.FUNCTION_NAME;
if (isCli && process.argv[2]) {
  (async () => {
    const inputPath = process.argv[2];
    const raw = fs.readFileSync(inputPath, 'utf8');
    const parsed: ProjectInput[] | ProjectsPayload = JSON.parse(raw);
    const projects = normalizeProjectsInput(parsed);
    const outputDir = process.argv[3] ?? defaultOutputDir;
    const result = await generateRDTIGADocx(projects, { outputDir });
    console.log(JSON.stringify(result, null, 2));
  })();
}
