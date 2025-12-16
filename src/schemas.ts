import { z } from 'zod';

/**
 * Zod schemas for RDTI GA DOCX input validation.
 * These provide runtime validation with automatic type inference.
 */

export const TimestampSchema = z.object({
  seconds: z.number(),
  nanoseconds: z.number(),
});

export const ProjectOwnerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.string().min(1, 'Role is required'),
  contactPhoneCountry: z.string().min(1, 'Contact phone country is required'),
  contactPhoneType: z.string().min(1, 'Contact phone type is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email format'),
});

export const CoreActivitySchema = z.object({
  name: z.string().min(1, 'Core activity name is required'),
  description: z.string().min(1, 'Core activity description is required'),
  startDate: z.string().min(1, 'Core activity start date is required'),
  endDate: z.string().min(1, 'Core activity end date is required'),
  uncertainties: z.string().min(1, 'Core activity uncertainties is required'),
  approach: z.string().min(1, 'Core activity approach is required'),
  intentions: z.string().min(1, 'Core activity intentions is required'),
});

// Note: intentional 'definiition' spelling preserved from input schema
export const SupportingActivitySchema = z.object({
  name: z.string().min(1, 'Supporting activity name is required'),
  description: z.string().min(1, 'Supporting activity description is required'),
  startDate: z.string().min(1, 'Supporting activity start date is required'),
  endDate: z.string().min(1, 'Supporting activity end date is required'),
  definiition: z.string().min(1, 'Supporting activity definition is required'),
});

export const ProjectInputSchema = z.object({
  uid: z.string().min(1, 'Project UID is required'),
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  projectDescription: z.string().optional(),
  customerName: z.string().optional(),
  projectName: z.string().optional(),
  estimatedSpend: z.string().optional(),
  fundingYes: z.string().optional(),
  fundingNo: z.string().optional(),
  SupportingYes: z.string().optional(),
  SupportingNo: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  createdAt: TimestampSchema,
  status: z.string().min(1, 'Status is required'),
  companyId: z.string().min(1, 'Company ID is required'),
  anzsrc: z.string().min(1, 'ANZSRC code is required'),
  projectOwner: ProjectOwnerSchema,
  coreActivities: z.array(CoreActivitySchema).min(1, 'At least one core activity is required'),
  supportingActivities: z.array(SupportingActivitySchema),
}).refine(
  (data) => data.description || data.projectDescription,
  { message: 'Either description or projectDescription is required', path: ['description'] }
);

export const ProjectsPayloadSchema = z.object({
  projects: z.array(ProjectInputSchema),
});

// Type inference from schemas
export type ProjectInputFromSchema = z.infer<typeof ProjectInputSchema>;
export type ProjectOwnerFromSchema = z.infer<typeof ProjectOwnerSchema>;
export type CoreActivityFromSchema = z.infer<typeof CoreActivitySchema>;
export type SupportingActivityFromSchema = z.infer<typeof SupportingActivitySchema>;

/**
 * Validate project input with Zod and return structured result.
 */
export function validateProjectWithZod(input: unknown): {
  success: boolean;
  data?: ProjectInputFromSchema;
  errors?: string[];
} {
  const result = ProjectInputSchema.safeParse(input);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.issues.map((issue) => 
    `${issue.path.join('.')}: ${issue.message}`
  );
  
  return { success: false, errors };
}

/**
 * Validate array of projects or projects payload with Zod.
 */
export function validateProjectsInputWithZod(input: unknown): {
  success: boolean;
  data?: ProjectInputFromSchema[];
  errors?: string[];
} {
  // Try as array first
  if (Array.isArray(input)) {
    const transformedItems: ProjectInputFromSchema[] = [];
    const errors: string[] = [];
    
    for (let idx = 0; idx < input.length; idx++) {
      const result = ProjectInputSchema.safeParse(input[idx]);
      if (result.success) {
        transformedItems.push(result.data);
      } else {
        errors.push(
          ...result.error.issues.map((issue) => 
            `projects[${idx}].${issue.path.join('.')}: ${issue.message}`
          )
        );
      }
    }
    
    if (errors.length > 0) {
      return { success: false, errors };
    }
    
    return { success: true, data: transformedItems };
  }
  
  // Try as payload wrapper
  const payloadResult = ProjectsPayloadSchema.safeParse(input);
  if (payloadResult.success) {
    return { success: true, data: payloadResult.data.projects };
  }
  
  const errors = payloadResult.error.issues.map((issue) => 
    `${issue.path.join('.')}: ${issue.message}`
  );
  
  return { success: false, errors };
}
