import archiver from "archiver";
import { renderDocx, DOCUMENT_LABELS, type DocumentKey } from "./generateDocx";
import { convertDocxToPdf } from "./convertToPdf";
import { isPdfSupported } from "./pdfSupport";
import { toTemplateData, type OrganizationWithCollections } from "./templateData";

/** Zips one .docx per requested document into one downloadable archive.
 * Also includes .pdf if this environment can actually produce it (see
 * pdfSupport.ts) — skipped entirely rather than erroring where it can't
 * (e.g. Vercel serverless, which has no LibreOffice binary available). */
export async function generatePackageZip(
  keys: DocumentKey[],
  org: OrganizationWithCollections,
): Promise<Buffer> {
  const pdfSupported = await isPdfSupported();
  const data = toTemplateData(org);

  const archive = archiver("zip", { zlib: { level: 9 } });
  const chunks: Buffer[] = [];
  archive.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise<void>((resolve, reject) => {
    archive.on("end", () => resolve());
    archive.on("error", reject);
  });

  for (const key of keys) {
    const docx = renderDocx(key, data);
    const label = DOCUMENT_LABELS[key] ?? key;
    archive.append(docx, { name: `${label}.docx` });
    if (pdfSupported) {
      const pdf = await convertDocxToPdf(docx);
      archive.append(pdf, { name: `${label}.pdf` });
    }
  }

  await archive.finalize();
  await done;
  return Buffer.concat(chunks);
}
