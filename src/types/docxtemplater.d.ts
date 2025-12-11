declare module 'docxtemplater' {
  import PizZip from 'pizzip';

  export interface DocxtemplaterOptions {
    paragraphLoop?: boolean;
    linebreaks?: boolean;
    delimiters?: {
      start?: string;
      end?: string;
    };
  }

  export default class Docxtemplater {
    constructor(zip: PizZip, options?: DocxtemplaterOptions);
    loadZip(zip: PizZip): this;
    setData(data: unknown): void;
    render(data?: unknown): void;
    getZip(): PizZip;
  }
}
