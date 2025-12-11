import type { ProjectInput, ProjectsPayload } from './types.js';

function isProjectsPayload(value: unknown): value is ProjectsPayload {
  return Boolean(value) && typeof value === 'object' && Array.isArray((value as ProjectsPayload).projects);
}

export function normalizeProjectsInput(value: ProjectInput[] | ProjectsPayload): ProjectInput[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (isProjectsPayload(value)) {
    return value.projects;
  }

  throw new Error('Input must be an array of projects or an object with a projects[] property');
}
