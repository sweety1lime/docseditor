/**
 * Re-authors exampleDocs/Политика_...docx into templates/masters/politika.docx.
 * Shares the exact same tag vocabulary and Приложение №1 "Цели обработки"
 * appendix schema as Положение (see build-polozhenie.ts) — Политика has no
 * signature block (no {director_signature_line} tag needed) and only the one
 * appendix (no Прил.№2/№3 here).
 *
 * Run: npx tsx scripts/reauthor/build-politika.ts
 */
import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";
import { applyScalarTags } from "./tagMap";
import { transformPurposesAppendix } from "./shared";

const ROOT = path.resolve(__dirname, "..", "..");
const SRC = path.join(ROOT, "exampleDocs", "Политика_обработки_персональных_данных.docx");
const OUT_DIR = path.join(ROOT, "templates", "masters");
const OUT = path.join(OUT_DIR, "politika.docx");

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

  xml = transformPurposesAppendix(
    xml,
    '<w:p w14:paraId="5A8BD38F"', // "Цель N 1" heading start
    '<w:p w14:paraId="6C78F6A0"', // trailing empty paragraph right after the table (block end, exclusive)
  );
  console.log("[appendix1] purposes block loop wired");

  zip.file("word/document.xml", xml);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT, zip.generate({ type: "nodebuffer" }));
  console.log(`Wrote ${OUT}`);
}

main();
