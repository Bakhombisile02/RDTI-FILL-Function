import type { ProjectInput, ProjectOwner, CoreActivity, SupportingActivity, ValidatedProject, ValidationIssue } from './types.js';

const requiredRootFields: Array<keyof ProjectInput> = [
  'uid',
  'name',
  'startDate',
  'endDate',
  'createdAt',
  'status',
  'companyId',
  'anzsrc',
  'projectOwner',
  'coreActivities',
  'supportingActivities',
];

const requiredOwnerFields: Array<keyof ProjectOwner> = [
  'firstName',
  'lastName',
  'role',
  'contactPhoneCountry',
  'contactPhoneType',
  'phone',
  'email',
];

const requiredCoreFields: Array<keyof CoreActivity> = [
  'name',
  'description',
  'startDate',
  'endDate',
  'uncertainties',
  'approach',
  'intentions',
];

const requiredSupportingFields: Array<keyof SupportingActivity> = [
  'name',
  'description',
  'startDate',
  'endDate',
  'definiition',
];

/** Type-safe field value getter */
function getFieldValue<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

function ensurePresent(value: unknown, path: string, issues: ValidationIssue[], type: 'error' | 'warning' = 'error') {
  if (value === undefined || value === null || value === '') {
    issues.push({ field: path, message: `Missing field: ${path}`, type });
  }
}

export function validateProject(input: ProjectInput): { project?: ValidatedProject; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];

  for (const field of requiredRootFields) {
    ensurePresent(getFieldValue(input, field), field, issues, 'error');
  }

  const owner = input.projectOwner;
  if (owner) {
    for (const field of requiredOwnerFields) {
      ensurePresent(getFieldValue(owner, field), `projectOwner.${field}`, issues, 'error');
    }
  }

  if (!Array.isArray(input.coreActivities) || input.coreActivities.length === 0) {
    issues.push({ field: 'coreActivities', message: 'A core activity is required', type: 'error' });
  } else {
    const activity = input.coreActivities[0];
    for (const field of requiredCoreFields) {
      ensurePresent(getFieldValue(activity, field), `coreActivities[0].${field}`, issues, 'error');
    }
  }

  if (Array.isArray(input.supportingActivities)) {
    input.supportingActivities.forEach((activity, idx) => {
      for (const field of requiredSupportingFields) {
        ensurePresent(getFieldValue(activity, field), `supportingActivities[${idx}].${field}`, issues, 'error');
      }
    });
  }

  // Falls back to projectDescription if description is missing (legacy field support)
  const descriptionSource = input.description ?? input.projectDescription;
  if (!descriptionSource) {
    issues.push({ field: 'description', message: 'Missing field: description', type: 'error' });
  }

  const project: ValidatedProject = {
    ...input,
    description: descriptionSource ?? '',
    projectDescription: input.projectDescription ?? descriptionSource ?? '',
  };

  return { project, issues };
}
