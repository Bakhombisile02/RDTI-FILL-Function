import { onRequest, HttpsError } from 'firebase-functions/v2/https';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateRDTIGADocx } from '../../dist/index.js';
import type { ProjectInput, ProjectsPayload } from '../../dist/types.js';

// ─────────────────────────────────────────────────────────────────────────────
// Security Configuration
// ─────────────────────────────────────────────────────────────────────────────

/** Maximum request body size in bytes (1 MB) */
const MAX_BODY_SIZE = 1 * 1024 * 1024;

/** Maximum number of projects per request */
const MAX_PROJECTS = 50;

/** Allowed origins for CORS (configure for production) */
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

/** API key for simple authentication (use Firebase Auth in production) */
const API_KEY = process.env.RDTI_API_KEY;

// ─────────────────────────────────────────────────────────────────────────────
// Validation Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Type guard to check if input is a projects payload wrapper */
function isProjectsPayload(value: unknown): value is ProjectsPayload {
  return value !== null && typeof value === 'object' && 'projects' in value && Array.isArray((value as ProjectsPayload).projects);
}

/** Type guard to check if input is a valid project array */
function isProjectArray(value: unknown): value is ProjectInput[] {
  return Array.isArray(value);
}

/** Sanitize string to prevent injection attacks */
function sanitizeString(str: unknown): string {
  if (typeof str !== 'string') return '';
  // Strip HTML tags (basic XSS prevention) and enforce max length
  // Note: For production, consider a dedicated sanitization library like DOMPurify
  return str.replace(/<[^>]*>/g, '').substring(0, 10000);
}

/** Validate a single project has required structure */
function isValidProjectStructure(project: unknown): project is ProjectInput {
  if (!project || typeof project !== 'object') return false;
  const p = project as Record<string, unknown>;
  
  // Check essential required fields exist
  return (
    typeof p.uid === 'string' &&
    typeof p.name === 'string' &&
    typeof p.companyId === 'string' &&
    p.projectOwner !== null &&
    typeof p.projectOwner === 'object' &&
    Array.isArray(p.coreActivities)
  );
}

/** Sanitize project input to prevent injection */
function sanitizeProject(project: ProjectInput): ProjectInput {
  return {
    ...project,
    uid: sanitizeString(project.uid),
    name: sanitizeString(project.name),
    description: sanitizeString(project.description),
    projectDescription: project.projectDescription ? sanitizeString(project.projectDescription) : undefined,
    customerName: project.customerName ? sanitizeString(project.customerName) : undefined,
    companyId: sanitizeString(project.companyId),
    anzsrc: sanitizeString(project.anzsrc),
    projectOwner: {
      ...project.projectOwner,
      firstName: sanitizeString(project.projectOwner?.firstName),
      lastName: sanitizeString(project.projectOwner?.lastName),
      email: sanitizeString(project.projectOwner?.email),
      phone: sanitizeString(project.projectOwner?.phone),
      role: sanitizeString(project.projectOwner?.role),
      contactPhoneCountry: sanitizeString(project.projectOwner?.contactPhoneCountry),
      contactPhoneType: sanitizeString(project.projectOwner?.contactPhoneType),
    },
    coreActivities: (project.coreActivities || []).map(activity => ({
      ...activity,
      name: sanitizeString(activity.name),
      description: sanitizeString(activity.description),
      uncertainties: sanitizeString(activity.uncertainties),
      approach: sanitizeString(activity.approach),
      intentions: sanitizeString(activity.intentions),
    })),
    supportingActivities: (project.supportingActivities || []).map(activity => ({
      ...activity,
      name: sanitizeString(activity.name),
      description: sanitizeString(activity.description),
      definiition: sanitizeString(activity.definiition),
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Path Configuration
// ─────────────────────────────────────────────────────────────────────────────

const templatePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'template',
  'GA-Application-Template-Version-1.61-December-2024 (1).docx',
);

// ─────────────────────────────────────────────────────────────────────────────
// Cloud Function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Secure HTTP function to generate RDTI GA DOCX files.
 * 
 * Security measures:
 * - CORS protection with configurable allowed origins
 * - API key authentication (optional, enable via RDTI_API_KEY env var)
 * - Request size limits
 * - Input validation and sanitization
 * - Rate limiting via Firebase (configure in firebase.json)
 * - Proper error handling without leaking internals
 */
export const generateGaDocx = onRequest(
  {
    // Firebase v2 options for security
    cors: ALLOWED_ORIGINS,
    maxInstances: 10, // Prevent runaway scaling
    timeoutSeconds: 60, // Reasonable timeout
    memory: '256MiB', // Limit memory usage
  },
  async (req, res) => {
    // ─── Method Check ───────────────────────────────────────────────────────
    if (req.method === 'OPTIONS') {
      // CORS preflight handled by Firebase
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ 
        error: 'Method not allowed',
        message: 'Use POST with JSON body of projects[] or {projects: []}' 
      });
      return;
    }

    // ─── API Key Authentication (if configured) ─────────────────────────────
    if (API_KEY) {
      const providedKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
      if (providedKey !== API_KEY) {
        res.status(401).json({ error: 'Unauthorized', message: 'Invalid or missing API key' });
        return;
      }
    }

    // ─── Content-Type Check ─────────────────────────────────────────────────
    const contentType = req.headers['content-type'];
    if (!contentType?.includes('application/json')) {
      res.status(415).json({ 
        error: 'Unsupported Media Type',
        message: 'Content-Type must be application/json' 
      });
      return;
    }

    // ─── Body Size Check ────────────────────────────────────────────────────
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > MAX_BODY_SIZE) {
      res.status(413).json({ 
        error: 'Payload Too Large',
        message: `Request body must be less than ${MAX_BODY_SIZE / 1024 / 1024} MB` 
      });
      return;
    }

    try {
      // ─── Parse and Validate Input ───────────────────────────────────────────
      const body = req.body;

      if (!body || (typeof body === 'object' && Object.keys(body).length === 0)) {
        res.status(400).json({ 
          error: 'Bad Request',
          message: 'Request body is empty or invalid JSON' 
        });
        return;
      }

      // Normalize to array
      let projects: unknown[];
      if (isProjectsPayload(body)) {
        projects = body.projects;
      } else if (isProjectArray(body)) {
        projects = body;
      } else {
        res.status(400).json({ 
          error: 'Bad Request',
          message: 'Body must be an array of projects or {projects: [...]}' 
        });
        return;
      }

      // ─── Validate Project Count ─────────────────────────────────────────────
      if (projects.length === 0) {
        res.status(400).json({ 
          error: 'Bad Request',
          message: 'At least one project is required' 
        });
        return;
      }

      if (projects.length > MAX_PROJECTS) {
        res.status(400).json({ 
          error: 'Bad Request',
          message: `Maximum ${MAX_PROJECTS} projects per request` 
        });
        return;
      }

      // ─── Validate Project Structure ─────────────────────────────────────────
      for (let i = 0; i < projects.length; i++) {
        if (!isValidProjectStructure(projects[i])) {
          res.status(400).json({ 
            error: 'Bad Request',
            message: `Project at index ${i} is missing required fields (uid, name, companyId, projectOwner, coreActivities)` 
          });
          return;
        }
      }

      // ─── Sanitize Input ─────────────────────────────────────────────────────
      const sanitizedProjects = (projects as ProjectInput[]).map(sanitizeProject);

      // ─── Generate DOCX ──────────────────────────────────────────────────────
      const outputDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'output');
      const result = await generateRDTIGADocx(sanitizedProjects, { outputDir, templatePath });

      // ─── Return Result ──────────────────────────────────────────────────────
      res.status(200).json({
        success: result.status === 'success',
        ...result,
      });

    } catch (err: unknown) {
      // Log full error internally (visible in Cloud Functions logs)
      console.error('DOCX generation error:', err);

      // Return sanitized error to client
      const isKnownError = err instanceof Error;
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: isKnownError ? err.message : 'An unexpected error occurred',
        // Only include stack in development
        ...(process.env.NODE_ENV === 'development' && isKnownError && { stack: err.stack }),
      });
    }
  }
);
