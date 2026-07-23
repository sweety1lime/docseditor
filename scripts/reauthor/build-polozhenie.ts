/**
 * Re-authors exampleDocs/Положение_...docx (the master ПДн regulation) into a
 * docxtemplater-ready merge template at templates/masters/polozhenie.docx.
 *
 * Four passes over word/document.xml:
 *  1. Scalar tags — every yellow-highlighted run (org name, address, ИНН, etc.)
 *     appearing throughout the document (contact block, TOC, appendix
 *     headings, ...) becomes its merge tag. See tagMap.ts.
 *  2. Приложение №2 (Перечень ПДн) — the single yellow-shaded example row is
 *     converted into a docxtemplater table-row loop over `pdItems`.
 *  3. Приложение №3 (Перечень ИСПДн) — same idea, loop over `ispdnItems`.
 *  4. Приложение №1 (Цели обработки) — this one isn't a table row inside a
 *     bigger table; it's a whole standalone "heading + 8-row label/value
 *     table" per purpose. Rather than flattening it into a cramped 8-column
 *     wide table (the appendix tables live in a landscape section; this one
 *     lives in the portrait section, so 8 columns would be unreadably
 *     narrow), we keep the original, more readable per-purpose block layout
 *     and wrap the whole thing (heading paragraph + table) in a
 *     `{#purposes}...{/purposes}` block loop — docxtemplater's core loop
 *     feature repeats arbitrary content (not just single table rows), so the
 *     entire block repeats once per purpose.
 *
 * Run: npx tsx scripts/reauthor/build-polozhenie.ts
 */
import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";
import { applyScalarTags } from "./tagMap";
import { transformPurposesAppendix, transformWideAppendixRow } from "./shared";

const ROOT = path.resolve(__dirname, "..", "..");
const SRC = path.join(
  ROOT,
  "exampleDocs",
  "Положение_об_организации_обработки_и_защиты_персональных_данных.docx",
);
const OUT_DIR = path.join(ROOT, "templates", "masters");
const OUT = path.join(OUT_DIR, "polozhenie.docx");

function transformAppendix1(xml: string): string {
  return transformPurposesAppendix(
    xml,
    '<w:p w14:paraId="193EA7EA"', // "Цель N 1" heading start
    '<w:p w14:paraId="506E0454"', // next appendix's page-break paragraph (block end, exclusive)
  );
}

function main() {
  const buf = fs.readFileSync(SRC);
  const zip = new PizZip(buf);
  let xml = zip.file("word/document.xml")!.asText();

  const scalarResult = applyScalarTags(xml);
  xml = scalarResult.xml;
  console.log(`[scalar] replaced ${scalarResult.replaced} runs`);
  if (scalarResult.unknown.length) {
    console.warn("[scalar] UNKNOWN highlighted texts (not replaced):", scalarResult.unknown);
  }

  xml = transformWideAppendixRow(
    xml,
    '<w:tr w:rsidR="00B8718B" w:rsidRPr="00B95F88" w14:paraId="70FCD1A5"',
    "pdItems",
    ["{nn}", "{subjectCategory}", "{dataCategories}", "{purpose}", "{processingMethod}", "{retentionPeriod}"],
  );
  console.log("[appendix2] pdItems loop row wired");

  xml = transformWideAppendixRow(
    xml,
    '<w:tr w:rsidR="00B8718B" w:rsidRPr="00B95F88" w14:paraId="713C99C5"',
    "ispdnItems",
    [
      "{nn}",
      "{name}",
      "{purpose}",
      "{volume}",
      "{subjectCategory}",
      "{dataComposition}",
      "{threatType}",
      "{protectionLevel}",
      "{location}",
    ],
  );
  console.log("[appendix3] ispdnItems loop row wired");

  xml = transformAppendix1(xml);
  console.log("[appendix1] purposes block loop wired");

  zip.file("word/document.xml", xml);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT, zip.generate({ type: "nodebuffer" }));
  console.log(`Wrote ${OUT}`);
}

main();
