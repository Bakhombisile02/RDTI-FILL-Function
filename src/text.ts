const latexPattern = /\$(.*?)\$/g;
const markdownPattern = /[*_`~]/g;

export function sanitizePlainText(value: string | undefined | null): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(latexPattern, '$1')
    .replace(markdownPattern, '')
    .replace(/\s+/g, ' ')
    .trim();
}
