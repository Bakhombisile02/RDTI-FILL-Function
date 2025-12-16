import { describe, it, expect } from 'vitest';
import { normalizeProjectsInput } from '../projects.js';
import type { ProjectInput, ProjectsPayload } from '../types.js';

const createMinimalProject = (overrides: Partial<ProjectInput> = {}): ProjectInput => ({
  uid: 'test-uid',
  name: 'Test Project',
  description: 'Test description',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  createdAt: { seconds: 1704067200, nanoseconds: 0 },
  status: 'Active',
  companyId: 'CMP-001',
  anzsrc: '080101',
  projectOwner: {
    firstName: 'John',
    lastName: 'Doe',
    role: 'Manager',
    contactPhoneCountry: '+64',
    contactPhoneType: 'Mobile',
    phone: '021-123-4567',
    email: 'john@example.com',
  },
  coreActivities: [
    {
      name: 'Core Activity 1',
      description: 'Core description',
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      uncertainties: 'Some uncertainties',
      approach: 'Some approach',
      intentions: 'Some intentions',
    },
  ],
  supportingActivities: [],
  ...overrides,
});

describe('normalizeProjectsInput', () => {
  it('returns array input unchanged', () => {
    const projects = [createMinimalProject()];
    const result = normalizeProjectsInput(projects);
    expect(result).toBe(projects);
    expect(result).toHaveLength(1);
  });

  it('extracts projects from wrapper object', () => {
    const projects = [createMinimalProject(), createMinimalProject({ uid: 'test-uid-2' })];
    const payload: ProjectsPayload = { projects };
    const result = normalizeProjectsInput(payload);
    expect(result).toBe(projects);
    expect(result).toHaveLength(2);
  });

  it('returns empty array from wrapper with empty projects', () => {
    const payload: ProjectsPayload = { projects: [] };
    const result = normalizeProjectsInput(payload);
    expect(result).toEqual([]);
  });

  it('throws on invalid input (null)', () => {
    expect(() => normalizeProjectsInput(null as unknown as ProjectInput[])).toThrow(
      'Input must be an array of projects or an object with a projects[] property'
    );
  });

  it('throws on invalid input (string)', () => {
    expect(() => normalizeProjectsInput('invalid' as unknown as ProjectInput[])).toThrow(
      'Input must be an array of projects or an object with a projects[] property'
    );
  });

  it('throws on object without projects property', () => {
    expect(() => normalizeProjectsInput({ data: [] } as unknown as ProjectsPayload)).toThrow(
      'Input must be an array of projects or an object with a projects[] property'
    );
  });
});
