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
  definiition: string; // preserved spelling from input
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

export interface ValidationIssue {
  field: string;
  message: string;
  type: 'error' | 'warning';
}

export interface ValidatedProject extends ProjectInput {}

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
