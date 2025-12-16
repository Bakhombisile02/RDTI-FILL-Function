import { describe, it, expect } from 'vitest';
import { validateProject } from '../validation.js';
import type { ProjectInput, CoreActivity, SupportingActivity, ProjectOwner } from '../types.js';

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

describe('validateProject', () => {
  describe('valid projects', () => {
    it('validates a complete project with no issues', () => {
      const input = createMinimalProject();
      const { project, issues } = validateProject(input);
      
      expect(issues).toHaveLength(0);
      expect(project).toBeDefined();
      expect(project?.uid).toBe('test-uid');
    });

    it('validates project with supporting activities', () => {
      const input = createMinimalProject({
        supportingActivities: [
          {
            name: 'Supporting Activity 1',
            description: 'Supporting description',
            startDate: '2024-01-15',
            endDate: '2024-03-31',
            definiition: 'Definition text', // intentional spelling
          },
        ],
      });
      const { project, issues } = validateProject(input);
      
      expect(issues).toHaveLength(0);
      expect(project?.supportingActivities).toHaveLength(1);
    });
  });

  describe('missing root fields', () => {
    it('reports missing uid', () => {
      const input = createMinimalProject({ uid: '' });
      const { issues } = validateProject(input);
      
      expect(issues).toContainEqual(
        expect.objectContaining({ field: 'uid', type: 'error' })
      );
    });

    it('reports missing name', () => {
      const input = createMinimalProject({ name: '' });
      const { issues } = validateProject(input);
      
      expect(issues).toContainEqual(
        expect.objectContaining({ field: 'name', type: 'error' })
      );
    });

    it('reports missing companyId', () => {
      const input = createMinimalProject({ companyId: '' });
      const { issues } = validateProject(input);
      
      expect(issues).toContainEqual(
        expect.objectContaining({ field: 'companyId', type: 'error' })
      );
    });
  });

  describe('missing projectOwner fields', () => {
    it('reports missing owner firstName', () => {
      const input = createMinimalProject({
        projectOwner: {
          ...createMinimalProject().projectOwner,
          firstName: '',
        },
      });
      const { issues } = validateProject(input);
      
      expect(issues).toContainEqual(
        expect.objectContaining({ field: 'projectOwner.firstName', type: 'error' })
      );
    });

    it('reports missing owner email', () => {
      const input = createMinimalProject({
        projectOwner: {
          ...createMinimalProject().projectOwner,
          email: '',
        },
      });
      const { issues } = validateProject(input);
      
      expect(issues).toContainEqual(
        expect.objectContaining({ field: 'projectOwner.email', type: 'error' })
      );
    });
  });

  describe('coreActivities validation', () => {
    it('reports missing coreActivities array', () => {
      const input = createMinimalProject({ coreActivities: [] });
      const { issues } = validateProject(input);
      
      expect(issues).toContainEqual(
        expect.objectContaining({ field: 'coreActivities', message: 'A core activity is required' })
      );
    });

    it('reports missing core activity fields', () => {
      const input = createMinimalProject({
        coreActivities: [
          {
            name: '',
            description: 'Description',
            startDate: '2024-01-01',
            endDate: '2024-06-30',
            uncertainties: '',
            approach: 'Approach',
            intentions: 'Intentions',
          },
        ],
      });
      const { issues } = validateProject(input);
      
      expect(issues).toContainEqual(
        expect.objectContaining({ field: 'coreActivities[0].name', type: 'error' })
      );
      expect(issues).toContainEqual(
        expect.objectContaining({ field: 'coreActivities[0].uncertainties', type: 'error' })
      );
    });
  });

  describe('supportingActivities validation', () => {
    it('reports missing supporting activity fields', () => {
      const input = createMinimalProject({
        supportingActivities: [
          {
            name: 'Activity',
            description: '',
            startDate: '2024-01-15',
            endDate: '2024-03-31',
            definiition: '', // intentional spelling
          },
        ],
      });
      const { issues } = validateProject(input);
      
      expect(issues).toContainEqual(
        expect.objectContaining({ field: 'supportingActivities[0].description', type: 'error' })
      );
      expect(issues).toContainEqual(
        expect.objectContaining({ field: 'supportingActivities[0].definiition', type: 'error' })
      );
    });

    it('validates multiple supporting activities independently', () => {
      const input = createMinimalProject({
        supportingActivities: [
          {
            name: 'Activity 1',
            description: 'Valid',
            startDate: '2024-01-15',
            endDate: '2024-03-31',
            definiition: 'Valid',
          },
          {
            name: '',
            description: 'Valid',
            startDate: '2024-04-01',
            endDate: '2024-06-30',
            definiition: 'Valid',
          },
        ],
      });
      const { issues } = validateProject(input);
      
      expect(issues).toContainEqual(
        expect.objectContaining({ field: 'supportingActivities[1].name', type: 'error' })
      );
      expect(issues).not.toContainEqual(
        expect.objectContaining({ field: 'supportingActivities[0].name' })
      );
    });
  });

  describe('description fallback', () => {
    it('uses projectDescription when description is undefined', () => {
      const input = createMinimalProject();
      // @ts-expect-error - testing undefined field behavior
      delete input.description;
      input.projectDescription = 'Fallback description';
      
      const { project, issues } = validateProject(input);
      
      // Fallback works for undefined (uses ??)
      expect(project?.description).toBe('Fallback description');
      expect(project?.projectDescription).toBe('Fallback description');
    });

    it('does not fallback when description is empty string', () => {
      const input = createMinimalProject({
        description: '',
        projectDescription: 'Fallback description',
      });
      const { project, issues } = validateProject(input);
      
      // Empty string is not nullish, so ?? doesn't trigger fallback
      expect(project?.description).toBe('');
      expect(issues).toContainEqual(
        expect.objectContaining({ field: 'description', type: 'error' })
      );
    });

    it('reports error when both description and projectDescription are missing', () => {
      const input = createMinimalProject({
        description: '',
        projectDescription: '',
      });
      const { issues } = validateProject(input);
      
      expect(issues).toContainEqual(
        expect.objectContaining({ field: 'description', type: 'error' })
      );
    });
  });
});
