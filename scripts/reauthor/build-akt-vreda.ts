/**
 * Re-authors exampleDocs/Акт_оценки_вреда_субъектам_персональных_данных.docx
 * into templates/masters/akt-vreda.docx.
 *
 * Structurally different from every other master: it has TWO separate loops
 * over the SAME `harmCategories` collection —
 *  1. A summary table (Категория | Степень возможного вреда) — one row per
 *     category, same "table-row loop" mechanism as Положение's Прил.№2/№3.
 *  2. Приложение №1: a "category heading + 17-row checklist table" block per
 *     category (13 real parameter rows + header + 3 section-divider rows) —
 *     same "whole-block loop" mechanism as Положение's Прил.№1 (Цели).
 *
 * The 13 parameter rows' *question* text is fixed legal wording (Приказ
 * Роскомнадзора №178) — only their "осуществляется"/"не осуществляется"
 * answer varies per category, so only those value cells get tagged; the
 * question text itself is left completely untouched. The harm *degree* in
 * the summary table is derived from the checklist answers at generation
 * time (see src/lib/harmParams.ts) rather than being its own tag, so it can
 * never drift out of sync with the checklist.
 *
 * The source document ships 4 example categories (Работники, Кандидаты,
 * Подрядчики, Собственники) with IDENTICAL table structure in each — we keep
 * the FIRST category's markup as the loop template and delete the other 3
 * (regenerated from data at render time).
 *
 * Run: npx tsx scripts/reauthor/build-akt-vreda.ts
 */
import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";
import { applyScalarTags } from "./tagMap";
import { must } from "./shared";
import { HARM_PARAMS } from "../../src/lib/harmParams";

const ROOT = path.resolve(__dirname, "..", "..");
const SRC = path.join(ROOT, "exampleDocs", "Акт_оценки_вреда_субъектам_персональных_данных.docx");
const OUT_DIR = path.join(ROOT, "templates", "masters");
const OUT = path.join(OUT_DIR, "akt-vreda.docx");

/** Replaces the last <w:t>...</w:t> found at/after `fromIndex` in `xml` with `tag`,
 * returning the new full string plus the index right after the replaced tag
 * (so callers can keep scanning forward without re-finding earlier matches). */
function replaceNextValueCell(xml: string, fromIndex: number, tag: string): string {
  const rest = xml.slice(fromIndex);
  const m = rest.match(/<w:t([^>]*)>([^<]*)<\/w:t>/);
  if (!m) throw new Error(`No <w:t> found after index ${fromIndex}`);
  const absStart = fromIndex + m.index!;
  const absEnd = absStart + m[0].length;
  return xml.slice(0, absStart) + `<w:t${m[1]}>${tag}</w:t>` + xml.slice(absEnd);
}

function transformSummaryTable(xml: string): string {
  const row1Start = must(xml, '<w:tr w:rsidR="00D11998" w14:paraId="03D712E3"', "summary row1 (Работники)");
  const row1End = must(xml, "</w:tr>", "summary row1 end", row1Start) + "</w:tr>".length;
  const deleteStart = must(xml, '<w:tr w:rsidR="00D11998" w14:paraId="0A5C3F01"', "summary row2 (Кандидаты)", row1End);
  const tableEnd = must(xml, "</w:tbl>", "summary table end", deleteStart);

  let row1 = xml.slice(row1Start, row1End);
  // First cell: category name, prefixed with the loop-open tag.
  row1 = replaceNextValueCell(row1, row1.indexOf("<w:tc"), "{#harmCategories}{name}");
  // Second cell: derived harm degree, suffixed with the loop-close tag. Find
  // the start of the *second* <w:tc> so we don't re-match the first cell.
  const secondTcStart = must(row1, "<w:tc", "summary row1 second cell", must(row1, "</w:tc>", "row1 first cell end"));
  row1 = row1.slice(0, secondTcStart) + replaceNextValueCell(row1.slice(secondTcStart), 0, "{harmDegree}{/harmCategories}");

  return xml.slice(0, row1Start) + row1 + xml.slice(tableEnd);
}

/**
 * Finds each of the 13 fixed parameter rows in the checklist table by
 * reconstructing each row's first-cell text across however many runs it's
 * split into (OOXML frequently splits a sentence across runs at proofErr /
 * page-break boundaries — confirmed here: h3's text is split into 4 runs).
 * Matching on the *reconstructed* text rather than a raw substring search
 * means the split doesn't matter; only the row's second cell (the
 * "осуществляется"/"не осуществляется" answer) gets tagged, so the fixed
 * legal wording in cell 1 is never touched regardless of how it's split.
 */
function tagParamRows(table: string): string {
  const rowMatches = [...table.matchAll(/<w:tr\b[\s\S]*?<\/w:tr>/g)];
  const replacements: Array<{ start: number; end: number; text: string }> = [];
  const matchedCodes = new Set<string>();

  for (const rowMatch of rowMatches) {
    const row = rowMatch[0];
    const cellMatches = [...row.matchAll(/<w:tc\b[\s\S]*?<\/w:tc>/g)];
    if (cellMatches.length !== 2) continue; // header row (2 cells, but no match) / divider rows (1 merged cell)

    const cell1Text = [...cellMatches[0][0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join("");
    // startsWith rather than exact equality: the source doc has one stray
    // trailing artifact (l1 ends in " 6", likely a pasted-in footnote number
    // from wherever this legal text was originally sourced) that we clean up
    // in harmParams.ts's display text without needing to special-case it here.
    const param = HARM_PARAMS.find((p) => cell1Text.startsWith(p.text));
    if (!param) continue;

    const cell2 = cellMatches[1][0];
    const valueMatch = cell2.match(/<w:t([^>]*)>([^<]*)<\/w:t>/);
    if (!valueMatch) throw new Error(`No value <w:t> found in row for param "${param.code}"`);

    const cell2AbsStart = rowMatch.index! + cellMatches[1].index!;
    const absStart = cell2AbsStart + valueMatch.index!;
    const absEnd = absStart + valueMatch[0].length;
    replacements.push({ start: absStart, end: absEnd, text: `<w:t${valueMatch[1]}>{${param.code}}</w:t>` });
    matchedCodes.add(param.code);
  }

  const missing = HARM_PARAMS.filter((p) => !matchedCodes.has(p.code));
  if (missing.length) {
    throw new Error(`Failed to locate rows for params: ${missing.map((p) => p.code).join(", ")}`);
  }

  // Apply back-to-front so earlier offsets stay valid.
  replacements.sort((a, b) => b.start - a.start);
  let out = table;
  for (const r of replacements) {
    out = out.slice(0, r.start) + r.text + out.slice(r.end);
  }
  return out;
}

function transformChecklistBlock(xml: string): string {
  const headingStart = must(xml, '<w:p w14:paraId="66E6F88C"', "category1 heading");
  const headingEnd = must(xml, "</w:p>", "category1 heading end", headingStart) + "</w:p>".length;
  const tableStart = must(xml, "<w:tbl>", "category1 table", headingEnd);
  const tableEnd = must(xml, "</w:tbl>", "category1 table end", tableStart) + "</w:tbl>".length;
  const deleteStart = must(xml, '<w:p w14:paraId="7839C3DD"', "category2 heading (delete-from)");
  const trailingParaStart = must(xml, '<w:p w14:paraId="1CD22806"', "trailing empty paragraph (delete-to)");

  let heading = xml.slice(headingStart, headingEnd);
  heading = heading.replace(
    /<w:t>Работники, Уволенные работники<\/w:t>/,
    "<w:t>{#harmCategories}{name}</w:t>",
  );
  if (!heading.includes("{#harmCategories}")) {
    throw new Error("Failed to tag category1 heading text");
  }

  let table = xml.slice(tableStart, tableEnd);
  table = tagParamRows(table);

  // Sanity check: category 2's heading should immediately follow category 1's
  // table with nothing unexpected in between (matches Положение's Прил.№1
  // layout, where consecutive purpose blocks are back-to-back).
  if (deleteStart !== tableEnd) {
    throw new Error(
      `Expected category2 heading to start exactly at table1's end (${tableEnd}), found at ${deleteStart}`,
    );
  }

  const closingPara = "<w:p><w:r><w:t>{/harmCategories}</w:t></w:r></w:p>";

  // Everything from tableEnd (= deleteStart) to trailingParaStart — i.e.
  // categories 2-4's headings+tables — is dropped by jumping straight to
  // trailingParaStart, since the loop regenerates them from data.
  return xml.slice(0, headingStart) + heading + table + closingPara + xml.slice(trailingParaStart);
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

  xml = transformSummaryTable(xml);
  console.log("[summary] harmCategories loop row wired");

  xml = transformChecklistBlock(xml);
  console.log("[checklist] harmCategories block loop wired (13 param tags)");

  zip.file("word/document.xml", xml);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT, zip.generate({ type: "nodebuffer" }));
  console.log(`Wrote ${OUT}`);
}

main();
