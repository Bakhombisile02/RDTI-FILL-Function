declare module 'firebase-functions/v2/https' {
  export function onRequest(
    options: {
      cors?: string[] | boolean;
      maxInstances?: number;
      timeoutSeconds?: number;
      memory?: string;
    },
    handler: (req: import('express').Request, res: import('express').Response) => void | Promise<void>
  ): import('firebase-functions').HttpsFunction;
  
  export function onRequest(
    handler: (req: import('express').Request, res: import('express').Response) => void | Promise<void>
  ): import('firebase-functions').HttpsFunction;

  export class HttpsError extends Error {
    constructor(code: string, message: string, details?: unknown);
  }
}

declare module '../../dist/index.js' {
  import type { ProjectInput, ProjectsPayload, DocxGenerateOptions, DocxGenerateResult } from '../../dist/types.js';
  export function generateRDTIGADocx(
    projects: ProjectInput[] | ProjectsPayload,
    options?: DocxGenerateOptions
  ): Promise<DocxGenerateResult>;
}

declare module '../../dist/types.js' {
  export interface TimestampLike {
    seconds: number;
    nanoseconds: number;
  }

  export interface ProjectOwner {
    firstName: string;
    lastName: string;
    role: string;
    contactPhoneCountry: string;
    contactPhoneType: string;
    phone: string;
    email: string;
  }

  export interface CoreActivity {
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    uncertainties: string;
    approach: string;
    intentions: string;
  }

  export interface SupportingActivity {
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    definiition: string;
  }

  export interface ProjectInput {
    uid: string;
    customerName?: string;
    projectName?: string;
    projectDescription?: string;
    estimatedSpend?: string;
    fundingYes?: string;
    fundingNo?: string;
    SupportingYes?: string;
    SupportingNo?: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    createdAt: TimestampLike;
    status: string;
    companyId: string;
    anzsrc: string;
    projectOwner: ProjectOwner;
    coreActivities: CoreActivity[];
    supportingActivities: SupportingActivity[];
  }

  export interface ProjectsPayload {
    projects: ProjectInput[];
  }

  export interface DocxGenerateOptions {
    outputDir?: string;
    dateFormat?: (iso: string) => string;
    templatePath?: string;
  }

  export interface DocxGenerateResult {
    status: 'success' | 'error';
    docx_path: string | null;
    docx_paths: string[];
    errors: string[];
  }
}
