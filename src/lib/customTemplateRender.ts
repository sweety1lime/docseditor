import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import type { CustomTemplateValues } from "./customTemplateTypes";

/**
 * Renders a stored custom template's bytes against its current values. Same
 * PizZip -> Docxtemplater -> render -> generate pipeline as generateDocx.ts's
 * renderDocx(), intentionally duplicated rather than shared: this pipeline
 * runs on arbitrary user-uploaded files, and keeping it isolated means a bug
 * surfaced by that input can never regress the 7 fixed legal documents.
 */
export function renderCustomTemplate(fileBytes: Buffer, values: CustomTemplateValues): Buffer {
  const zip = new PizZip(fileBytes);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  const data: Record<string, unknown> = { ...values.scalars, ...values.loops };
  doc.render(data);
  return doc.getZip().generate({ type: "nodebuffer" });
}
