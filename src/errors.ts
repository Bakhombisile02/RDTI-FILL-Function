/**
 * Base error class for RDTI GA DOCX generation errors.
 */
export class RDTIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RDTIError';
  }
}

/**
 * Error thrown when project validation fails.
 */
export class ValidationError extends RDTIError {
  public readonly projectId: string;
  public readonly fields: string[];

  constructor(projectId: string, fields: string[], message?: string) {
    super(message ?? `Validation failed for project ${projectId}: missing fields [${fields.join(', ')}]`);
    this.name = 'ValidationError';
    this.projectId = projectId;
    this.fields = fields;
  }
}

/**
 * Error thrown when template file cannot be loaded or parsed.
 */
export class TemplateError extends RDTIError {
  public readonly templatePath: string;

  constructor(templatePath: string, cause?: Error) {
    super(`Failed to load or parse template: ${templatePath}${cause ? ` - ${cause.message}` : ''}`);
    this.name = 'TemplateError';
    this.templatePath = templatePath;
  }
}

/**
 * Error thrown when DOCX rendering fails for a specific project.
 */
export class RenderError extends RDTIError {
  public readonly projectId: string;

  constructor(projectId: string, cause?: Error) {
    super(`Failed to render DOCX for project ${projectId}${cause ? ` - ${cause.message}` : ''}`);
    this.name = 'RenderError';
    this.projectId = projectId;
  }
}

/**
 * Error thrown when file system operations fail (e.g., writing output).
 */
export class FileSystemError extends RDTIError {
  public readonly filePath: string;
  public readonly operation: 'read' | 'write' | 'mkdir';

  constructor(filePath: string, operation: 'read' | 'write' | 'mkdir', cause?: Error) {
    super(`Failed to ${operation} file: ${filePath}${cause ? ` - ${cause.message}` : ''}`);
    this.name = 'FileSystemError';
    this.filePath = filePath;
    this.operation = operation;
  }
}
