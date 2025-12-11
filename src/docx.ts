import fs from 'fs';
import path from 'path';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import type { ValidatedProject, DocxGenerateOptions } from './types.js';

type DateFormatter = (iso: string) => string;
type Boolish = string | boolean | undefined | null;

interface DocxTemplateSupportingActivity {
  name: string;
  startDate: string;
  endDate: string;
  description: string;
  definiition: string;
  ActivityNumber: string;
}

/**
 * Payload shape for docxtemplater. Template uses {} delimiters.
 * Core activity is flattened (no loop) because the GA form only accepts one.
 * Supporting activities use {#supportingActivities}...{/supportingActivities} conditional
 * and {#supportingActivity}...{/supportingActivity} loop in the template.
 */
interface DocxTemplatePayload {
  customerName: string;
  projectName: string;
  projectDescription: string;
  estimatedSpend: string;
  fundingYes: string;
  fundingNo: string;
  SupportingYes: string;
  SupportingNo: string;
  startDate: string;
  endDate: string;
  anzsrc: string;
  projectOwner: ValidatedProject['projectOwner'];
  coreActivityName: string;
  coreActivityStartDate: string;
  coreActivityEndDate: string;
  coreActivityDescription: string;
  coreActivityUncertainties: string;
  coreActivityApproach: string;
  coreActivityIntentions: string;
  supportingActivities: boolean;
  supportingActivity: DocxTemplateSupportingActivity[];
}

const defaultDateFormat: DateFormatter = (iso: string) => iso;
const defaultTemplateName = 'GA-Application-Template-Version-1.61-December-2024 (1).docx';
export const defaultDocxTemplatePath = path.resolve('template', defaultTemplateName);
const defaultOutputDir = './output';

// Common affirmative/negative values from form checkboxes, boolean fields, and user input
const yesStrings = new Set(['yes', 'y', 'true', '1', 'x', 'checked', 'ok']);
const noStrings = new Set(['no', 'n', 'false', '0']);

function parseBoolish(value: Boolish): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  if (yesStrings.has(normalized)) return true;
  if (noStrings.has(normalized)) return false;
  return undefined;
}

function formatYesNo(yes: Boolish, no: Boolish, fallback?: boolean): { yesText: string; noText: string } {
  const yesParsed = parseBoolish(yes);
  const noParsed = parseBoolish(no);

  let isYes: boolean | undefined;
  if (yesParsed !== undefined) {
    isYes = yesParsed;
  } else if (noParsed !== undefined) {
    isYes = !noParsed;
  } else {
    isYes = fallback;
  }

  if (isYes === true) {
    return { yesText: 'YES', noText: '' };
  }
  if (isYes === false) {
    return { yesText: '', noText: 'NO' };
  }
  return { yesText: 'Yes', noText: 'No' };
}

function buildDocxTemplatePayload(project: ValidatedProject, format: DateFormatter): DocxTemplatePayload {
  const projectName = project.projectName ?? project.name;
  const funding = formatYesNo(project.fundingYes, project.fundingNo);
  const supporting = formatYesNo(
    project.SupportingYes,
    project.SupportingNo,
    project.supportingActivities.length > 0 ? true : false,
  );

  const coreActivity = project.coreActivities[0];

  return {
    customerName: project.customerName ?? project.companyId ?? projectName,
    projectName,
    projectDescription: project.projectDescription ?? project.description,
    estimatedSpend: project.estimatedSpend ?? 'TBD',
    fundingYes: funding.yesText,
    fundingNo: funding.noText,
    SupportingYes: supporting.yesText,
    SupportingNo: supporting.noText,
    startDate: format(project.startDate),
    endDate: format(project.endDate),
    anzsrc: project.anzsrc,
    projectOwner: project.projectOwner,
    coreActivityName: coreActivity?.name ?? '',
    coreActivityStartDate: coreActivity ? format(coreActivity.startDate) : '',
    coreActivityEndDate: coreActivity ? format(coreActivity.endDate) : '',
    coreActivityDescription: coreActivity?.description ?? '',
    coreActivityUncertainties: coreActivity?.uncertainties ?? '',
    coreActivityApproach: coreActivity?.approach ?? '',
    coreActivityIntentions: coreActivity?.intentions ?? '',
    supportingActivities: project.supportingActivities.length > 0,
    supportingActivity: project.supportingActivities.map((activity, idx) => ({
      name: activity.name,
      startDate: format(activity.startDate),
      endDate: format(activity.endDate),
      description: activity.description,
      definiition: activity.definiition,
      ActivityNumber: String(idx + 1),
    })),
  };
}

export async function renderDocxForProjects(
  projects: ValidatedProject[],
  options?: DocxGenerateOptions,
): Promise<string[]> {
  if (projects.length === 0) {
    throw new Error('At least one project is required to render DOCX output');
  }

  const outputDir = options?.outputDir ?? defaultOutputDir;
  const templatePath = options?.templatePath ?? defaultDocxTemplatePath;
  const format = options?.dateFormat ?? defaultDateFormat;

  const outputPaths: string[] = [];

  for (const project of projects) {
    const payload = buildDocxTemplatePayload(project, format);

    const templateBuffer = fs.readFileSync(templatePath);
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{', end: '}' },
    });
    doc.render(payload);

    const outputName = `RDTI_GA_${project.uid}.docx`;
    const outputPath = path.join(outputDir, outputName);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    const buffer = doc.getZip().generate({ type: 'nodebuffer' });
    fs.writeFileSync(outputPath, buffer);
    outputPaths.push(outputPath);
  }

  return outputPaths;
}
