/** Shared helpers for turning a "Цели обработки" appendix (heading + 8-row
 * label/value table per purpose) and wide appendix tables (header + one
 * yellow-shaded example row) into docxtemplater merge templates. Used by
 * both build-polozhenie.ts and build-politika.ts, which share the exact same
 * appendix schema and highlighting conventions. */

export function must(xml: string, marker: string, label: string, fromIndex = 0): number {
  const idx = xml.indexOf(marker, fromIndex);
  if (idx === -1) throw new Error(`Anchor not found (${label}): ${marker.slice(0, 60)}...`);
  return idx;
}

/** Replaces the Nth (1-based) occurrence of `needle` inside `haystack` with `replacement`. */
export function replaceNth(haystack: string, needle: string, n: number, replacement: string): string {
  let idx = -1;
  for (let i = 0; i < n; i++) {
    idx = haystack.indexOf(needle, idx + 1);
    if (idx === -1) throw new Error(`Occurrence ${n} of "${needle}" not found`);
  }
  return haystack.slice(0, idx) + replacement + haystack.slice(idx + needle.length);
}

/** Replaces the value-cell run text for a "Цель N" field: whichever occurrence of `label`
 * isn't the (possibly run-split) label cell. Prefers the 2nd of 2 matches; if the label
 * text only matches once verbatim (label cell text was split across runs), that one match
 * must be the value cell. */
export function replacePurposeField(tableXml: string, label: string, tag: string): string {
  const positions: number[] = [];
  let idx = -1;
  while ((idx = tableXml.indexOf(label, idx + 1)) !== -1) positions.push(idx);

  let target: number;
  if (positions.length === 2) target = positions[1];
  else if (positions.length === 1) target = positions[0];
  else throw new Error(`Expected 1 or 2 occurrences of "${label}", found ${positions.length}`);

  return tableXml.slice(0, target) + tag + tableXml.slice(target + label.length);
}

export const PURPOSE_FIELD_MAP: [string, string][] = [
  ["Цель обработки персональных данных", "{purpose}"],
  ["Наименование категории субъектов данных, чьи данные обрабатываются", "{subjectCategory}"],
  ["Состав обрабатываемых персональных данных в рамках процесса", "{dataComposition}"],
  ["Способ обработки персональных данных", "{processingMethod}"],
  ["Срок обработки и хранения персональных данных", "{retentionPeriod}"],
  [
    "Порядок уничтожения персональных данных при достижении целей их обработки или при наступлении иных законных оснований",
    "{destructionProcedure}",
  ],
  ["Перечень действий над персональными данными", "{actionsList}"],
  ["Правовое основание обработки персональных данных", "{legalBasis}"],
];

/**
 * Wraps a "heading + 8-row table" Приложение №1 block in a
 * `{#purposes}...{/purposes}` loop and replaces the heading's example
 * number and each row's value-cell text with merge tags.
 *
 * @param celHeadingMarker unique substring marking the start of the "Цель N 1"
 *   heading paragraph (kept as the loop body's first paragraph).
 * @param blockEndMarker unique substring marking where the block ends
 *   (exclusive) — the next appendix's heading, or end-of-document content.
 */
export function transformPurposesAppendix(
  xml: string,
  celHeadingMarker: string,
  blockEndMarker: string,
): string {
  const celHeadingStart = must(xml, celHeadingMarker, "Цель heading start");
  // blockEndMarker marks the start of the next preserved content (exclusive —
  // not itself part of the transformed block). Search from celHeadingStart
  // onward, since the same marker text may also occur earlier in the document.
  const blockEnd = must(xml, blockEndMarker, "appendix1 block end", celHeadingStart);

  let celBlock = xml.slice(celHeadingStart, blockEnd); // "Цель " heading + the 8-row table

  const headingEnd = must(celBlock, "</w:p>", "end of Цель heading paragraph") + "</w:p>".length;
  let heading = celBlock.slice(0, headingEnd);
  heading = replaceNth(heading, "<w:t>1</w:t>", 1, "<w:t>{nn}</w:t>");
  let table = celBlock.slice(headingEnd);

  for (const [label, tag] of PURPOSE_FIELD_MAP) {
    table = replacePurposeField(table, label, tag);
  }
  table = table.replace(/<w:shd w:val="clear" w:color="auto" w:fill="FFFF00"\/>/g, "");

  celBlock = heading + table;
  const wrapped =
    "<w:p><w:r><w:t>{#purposes}</w:t></w:r></w:p>" + celBlock + "<w:p><w:r><w:t>{/purposes}</w:t></w:r></w:p>";

  return xml.slice(0, celHeadingStart) + wrapped + xml.slice(blockEnd);
}

/** Приложение №2/№3-style wide table: converts the single yellow-shaded example row
 * into a table-row loop. */
export function transformWideAppendixRow(
  xml: string,
  rowStartMarker: string,
  loopVar: string,
  cellTags: string[], // in column order, left to right
): string {
  const rowStart = must(xml, rowStartMarker, `${loopVar} row start`);
  const rowEnd = xml.indexOf("</w:tr>", rowStart) + "</w:tr>".length;
  let row = xml.slice(rowStart, rowEnd);

  const cellTexts = [...row.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)];
  if (cellTexts.length !== cellTags.length) {
    throw new Error(
      `${loopVar}: expected ${cellTags.length} text runs in the example row, found ${cellTexts.length}`,
    );
  }

  for (let i = cellTexts.length - 1; i >= 0; i--) {
    const m = cellTexts[i];
    const full = m[0];
    const start = m.index!;
    let tag = cellTags[i];
    if (i === 0) tag = `{#${loopVar}}${tag}`;
    if (i === cellTags.length - 1) tag = `${tag}{/${loopVar}}`;
    const attrs = full.match(/<w:t([^>]*)>/)![1];
    row = row.slice(0, start) + `<w:t${attrs}>${tag}</w:t>` + row.slice(start + full.length);
  }
  row = row.replace(/<w:shd w:val="clear" w:color="auto" w:fill="FFFF00"\/>/g, "");

  return xml.slice(0, rowStart) + row + xml.slice(rowEnd);
}
