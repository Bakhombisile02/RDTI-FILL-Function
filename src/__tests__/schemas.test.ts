import { describe, it, expect } from 'vitest';
import {
  validateProjectWithZod,
  validateProjectsInputWithZod,
  ProjectInputSchema,
} from '../schemas.js';

const createValidProject = (): Record<string, unknown> => ({
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
});

describe('validateProjectWithZod', () => {
  it('validates a complete project successfully', () => {
    const result = validateProjectWithZod(createValidProject());
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.errors).toBeUndefined();
  });

  it('reports missing uid', () => {
    const project = { ...createValidProject(), uid: '' };
    const result = validateProjectWithZod(project);
    expect(result.success).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining('uid'));
  });

  it('reports invalid email format', () => {
    const project = createValidProject();
    (project.projectOwner as Record<string, string>).email = 'invalid-email';
    const result = validateProjectWithZod(project);
    expect(result.success).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining('email'));
  });

  it('reports missing core activities', () => {
    const project = { ...createValidProject(), coreActivities: [] };
    const result = validateProjectWithZod(project);
    expect(result.success).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining('coreActivities'));
  });

  it('accepts projectDescription when description is missing', () => {
    const project = createValidProject();
    delete (project as Record<string, unknown>).description;
    project.projectDescription = 'Fallback description';
    const result = validateProjectWithZod(project);
    expect(result.success).toBe(true);
  });

  it('fails when both description and projectDescription are missing', () => {
    const project = createValidProject();
    delete (project as Record<string, unknown>).description;
    delete (project as Record<string, unknown>).projectDescription;
    const result = validateProjectWithZod(project);
    expect(result.success).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining('description'));
  });
});

describe('validateProjectsInputWithZod', () => {
  it('validates array of projects', () => {
    const result = validateProjectsInputWithZod([createValidProject()]);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
  });

  it('validates projects payload wrapper', () => {
    const result = validateProjectsInputWithZod({
      projects: [createValidProject(), { ...createValidProject(), uid: 'test-uid-2' }],
    });
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
  });

  it('reports errors with project index', () => {
    const result = validateProjectsInputWithZod([
      createValidProject(),
      { ...createValidProject(), uid: '' },
    ]);
    expect(result.success).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining('projects[1]'));
  });

  it('handles invalid input format', () => {
    const result = validateProjectsInputWithZod({ notProjects: [] });
    expect(result.success).toBe(false);
  });
});

describe('SupportingActivity definiition spelling', () => {
  it('preserves intentional definiition spelling', () => {
    const project = createValidProject();
    project.supportingActivities = [
      {
        name: 'Supporting Activity',
        description: 'Description',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        definiition: 'Definition text', // intentional spelling
      },
    ];
    const result = validateProjectWithZod(project);
    expect(result.success).toBe(true);
    expect(result.data?.supportingActivities[0].definiition).toBe('Definition text');
  });
});
