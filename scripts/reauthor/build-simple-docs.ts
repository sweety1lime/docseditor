/**
 * Re-authors the four "simple" documents that only consume organization
 * requisites (no repeating collections, no appendix loops): Акт уничтожения,
 * both Журналы, and the Согласие consent form. Each only needs the scalar
 * yellow-highlight pass — confirmed by scanning all four for yellow table-
 * cell shading (the repeating-row marker used in Положение's appendices):
 * none found, so there's nothing to loop here.
 *
 * Согласие has an embedded logo (word/media/image1.png) referenced only from
 * its headers, never from document.xml — untouched by this pass since we
 * only rewrite text runs in document.xml.
 *
 * Run: npx tsx scripts/reauthor/build-simple-docs.ts
 */
import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";
import { applyScalarTags } from "./tagMap";

const ROOT = path.resolve(__dirname, "..", "..");
const OUT_DIR = path.join(ROOT, "templates", "masters");

const DOCS: Array<{ key: string; src: string; out: string }> = [
  {
    key: "aktUnichtozheniya",
    src: "Акт_уничтожения_персональных_данных.docx",
    out: "akt-unichtozheniya.docx",
  },
  {
    key: "zhurnalZayavleniy",
    src: "Журнал учета заявлений ПДн.docx",
    out: "zhurnal-zayavleniy.docx",
  },
  {
    key: "zhurnalNositeley",
    src: "Журнал_учета_машинных_носителей_ПДн.docx",
    out: "zhurnal-nositeley.docx",
  },
  {
    key: "soglasie",
    src: "ШАБЛОН - СОГЛАСИЕ.docx",
    out: "soglasie.docx",
  },
];

function build(doc: (typeof DOCS)[number]) {
  const srcPath = path.join(ROOT, "exampleDocs", doc.src);
  const buf = fs.readFileSync(srcPath);
  const zip = new PizZip(buf);
  const xml = zip.file("word/document.xml")!.asText();

  const result = applyScalarTags(xml);
  console.log(`[${doc.key}] replaced ${result.replaced} runs`);
  if (result.unknown.length) {
    console.warn(`[${doc.key}] UNKNOWN highlighted texts (not replaced):`, result.unknown);
  }

  zip.file("word/document.xml", result.xml);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, doc.out);
  fs.writeFileSync(outPath, zip.generate({ type: "nodebuffer" }));
  console.log(`Wrote ${outPath}`);
}

for (const doc of DOCS) build(doc);
