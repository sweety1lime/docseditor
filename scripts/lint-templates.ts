/**
 * Renders every master template against fixture data (N=2 per repeating
 * collection) and fails loudly if docxtemplater reports unresolved tags or
 * a rendering error. Fast feedback loop for template re-authoring — much
 * quicker than opening Word after every edit.
 */
import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import {
  sampleOrganization,
  samplePurposes,
  samplePdItems,
  sampleIspdn,
  sampleHarmCategories,
} from "../test/sample-data";

const ROOT = path.resolve(__dirname, "..");
const MASTERS_DIR = path.join(ROOT, "templates", "masters");
const OUT_DIR = path.join(ROOT, "tmp", "lint-output");

const data = {
  ...sampleOrganization,
  purposes: samplePurposes,
  pdItems: samplePdItems,
  ispdnItems: sampleIspdn,
  harmCategories: sampleHarmCategories,
};

function renderOne(file: string): { ok: boolean; errors: string[] } {
  const buf = fs.readFileSync(path.join(MASTERS_DIR, file));
  const zip = new PizZip(buf);
  // Which loops does this particular master actually use? Not every document
  // consumes every collection (e.g. Политика has no Прил.№2/№3) — only check
  // that a collection's fixture rows appear if the template loops over it.
  const sourceXml = zip.file("word/document.xml")!.asText();
  const usesPurposes = sourceXml.includes("{#purposes}");
  const usesPdItems = sourceXml.includes("{#pdItems}");
  const usesIspdn = sourceXml.includes("{#ispdnItems}");
  const usesHarmCategories = sourceXml.includes("{#harmCategories}");

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  try {
    doc.render(data);
  } catch (error: any) {
    const errors: string[] =
      error?.properties?.errors?.map((e: any) => `${e.name}: ${e.message} (${e.properties?.explanation ?? ""})`) ??
      [String(error)];
    return { ok: false, errors };
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outBuf = doc.getZip().generate({ type: "nodebuffer" });
  fs.writeFileSync(path.join(OUT_DIR, file), outBuf);

  // Sanity checks on the rendered text: no stray `{` tags left, and every
  // collection this template actually loops over had both fixture rows
  // expand (proves the loop expanded, not just rendered the literal syntax).
  const renderedXml = new PizZip(outBuf).file("word/document.xml")!.asText();
  const issues: string[] = [];
  if (renderedXml.includes("{#") || renderedXml.includes("{/")) {
    issues.push("loop delimiters survived into output (loop did not expand)");
  }
  const strayBraces = renderedXml.match(/\{[a-zA-Z0-9_]+\}/g);
  if (strayBraces) issues.push(`unresolved tags remained: ${strayBraces.join(", ")}`);
  if (usesPurposes) {
    for (const p of samplePurposes) {
      if (!renderedXml.includes(p.purpose)) issues.push(`purpose "${p.purpose}" missing from output`);
    }
  }
  if (usesPdItems) {
    for (const p of samplePdItems) {
      if (!renderedXml.includes(p.subjectCategory)) issues.push(`pdItem "${p.subjectCategory}" missing from output`);
    }
  }
  if (usesIspdn) {
    for (const i of sampleIspdn) {
      if (!renderedXml.includes(i.name)) issues.push(`ispdn "${i.name}" missing from output`);
    }
  }
  if (usesHarmCategories) {
    for (const h of sampleHarmCategories) {
      if (!renderedXml.includes(h.name)) issues.push(`harmCategory "${h.name}" missing from output`);
    }
    // Every occurrence of "осуществляется" is either standalone (true answer)
    // or part of "не осуществляется" (false answer). If the fixture has any
    // true answers, total occurrences must exceed the "не ..." count — proves
    // booleans mapped to the right Russian phrase, not all defaulting to false.
    const totalCount = (renderedXml.match(/осуществляется/g) ?? []).length;
    const negativeCount = (renderedXml.match(/не осуществляется/g) ?? []).length;
    const expectedTrueAnswers = sampleHarmCategories.reduce(
      (sum, cat) => sum + Object.values(cat).filter((v) => v === "осуществляется").length,
      0,
    );
    if (totalCount - negativeCount < expectedTrueAnswers) {
      issues.push('expected more "осуществляется" (true) answers to render than fixture has "не" negatives for');
    }
  }

  return { ok: issues.length === 0, errors: issues };
}

function main() {
  if (!fs.existsSync(MASTERS_DIR)) {
    console.error(`No templates found at ${MASTERS_DIR}`);
    process.exit(1);
  }
  const files = fs.readdirSync(MASTERS_DIR).filter((f) => f.endsWith(".docx"));
  if (!files.length) {
    console.error("No .docx templates to lint.");
    process.exit(1);
  }

  let failed = false;
  for (const file of files) {
    const { ok, errors } = renderOne(file);
    if (ok) {
      console.log(`OK   ${file}`);
    } else {
      failed = true;
      console.error(`FAIL ${file}`);
      for (const e of errors) console.error(`     - ${e}`);
    }
  }
  if (failed) process.exit(1);
  console.log(`\nAll templates rendered cleanly. Output in ${OUT_DIR}`);
}

main();
