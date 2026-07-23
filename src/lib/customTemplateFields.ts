import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
// The shipped .d.ts for this subpath declares the default export as the
// InspectModule *class*, but at runtime it's a factory function that
// returns an instance (see node_modules/docxtemplater/js/inspect-module.js:
// `module.exports = function () { return new InspectModule(); }`) — cast
// through `unknown` to the shape actually used here instead of fighting the
// mismatched types.
import inspectModuleImport from "docxtemplater/js/inspect-module.js";
import type { DetectedFields, LoopField } from "./customTemplateTypes";

interface InspectModuleInstance {
  getAllStructuredTags(): unknown[];
}
const inspectModule = inspectModuleImport as unknown as () => InspectModuleInstance;

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_UNCOMPRESSED_BYTES = 50 * 1024 * 1024;
const MAX_ZIP_ENTRIES = 2000;

export class TemplateValidationError extends Error {}

interface StructuredPart {
  type: string;
  value: string;
  module?: string;
  inverted?: boolean;
  subparsed?: StructuredPart[];
}

type Classified =
  | { kind: "scalar"; name: string }
  | { kind: "loop"; name: string; columns: string[] }
  | { kind: "error"; message: string };

/**
 * Classifies one top-level discovered tag. A tag is a loop only if
 * docxtemplater's loop module produced it (module === "loop") and it isn't
 * inverted ({^tag}) — anything else with nested structure (an unrecognized
 * module, an inverted section, or a loop whose children are themselves
 * structured) is rejected rather than guessed at, since silently misreading
 * an unsupported pattern would produce a form that can never actually fill
 * in that part of the document.
 */
function classifyPart(part: StructuredPart): Classified {
  const hasStructure = Array.isArray(part.subparsed) && part.subparsed.length > 0;

  if (!part.module && !hasStructure) {
    return { kind: "scalar", name: part.value };
  }

  if (part.module !== "loop") {
    return { kind: "error", message: `Тег «${part.value}» использует неподдерживаемую конструкцию шаблона` };
  }

  if (part.inverted) {
    return {
      kind: "error",
      message: `Инвертированные секции {^${part.value}} не поддерживаются — используйте {#${part.value}}...{/${part.value}}`,
    };
  }

  const columns: string[] = [];
  for (const child of part.subparsed ?? []) {
    if (child.module || (Array.isArray(child.subparsed) && child.subparsed.length > 0)) {
      return {
        kind: "error",
        message: `Вложенные циклы не поддерживаются: {#${part.value}} содержит структуру внутри «${child.value}»`,
      };
    }
    columns.push(child.value);
  }
  return { kind: "loop", name: part.value, columns };
}

/**
 * Validates, classifies, and dry-renders an uploaded .docx in one pass.
 * Throws TemplateValidationError (Russian message) on the first problem
 * found. On success, the returned fields are guaranteed renderable at least
 * once with fixture data.
 */
export function inspectAndValidateTemplate(fileBuffer: Buffer): DetectedFields {
  if (fileBuffer.length > MAX_UPLOAD_BYTES) {
    throw new TemplateValidationError(
      `Файл слишком большой (${(fileBuffer.length / 1024 / 1024).toFixed(1)} МБ) — максимум ${MAX_UPLOAD_BYTES / 1024 / 1024} МБ`,
    );
  }

  let zip: PizZip;
  try {
    zip = new PizZip(fileBuffer);
  } catch {
    throw new TemplateValidationError("Файл повреждён или не является .docx");
  }

  const entryNames = Object.keys(zip.files);
  if (entryNames.length > MAX_ZIP_ENTRIES) {
    throw new TemplateValidationError("Файл содержит подозрительно много вложенных частей");
  }
  if (!zip.file("[Content_Types].xml") || !zip.file("word/document.xml")) {
    throw new TemplateValidationError("Не похоже на .docx-документ (не найдены обязательные части OOXML)");
  }

  let uncompressedTotal = 0;
  for (const name of entryNames) {
    const entry = zip.files[name];
    if (entry.dir) continue;
    // `_data.uncompressedSize` is an undocumented pizzip/JSZip-compatible
    // internal (same tier of "reach into pizzip internals" as the `.asText()`
    // usage in scripts/lint-templates.ts) — reading it avoids inflating
    // every entry just to size-check for a zip bomb.
    const size = (entry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0;
    uncompressedTotal += size;
  }
  if (uncompressedTotal > MAX_UNCOMPRESSED_BYTES) {
    throw new TemplateValidationError("Файл разворачивается в слишком большой объём данных");
  }

  const contentTypesText = zip.file("[Content_Types].xml")!.asText();
  if (contentTypesText.includes("macroEnabled") || zip.file("word/vbaProject.bin")) {
    throw new TemplateValidationError("Файлы с макросами не поддерживаются — сохраните шаблон как обычный .docx");
  }

  const iModule = inspectModule();
  let doc: Docxtemplater;
  try {
    doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      modules: [iModule],
    });
  } catch (error) {
    throw new TemplateValidationError(formatDocxtemplaterError(error, "Не удалось разобрать шаблон"));
  }
  void doc;

  const structuredTags = iModule.getAllStructuredTags() as unknown as StructuredPart[];
  if (structuredTags.length === 0) {
    throw new TemplateValidationError("В шаблоне не найдено ни одного поля {тег} или таблицы {#…}");
  }

  const scalarNames: string[] = [];
  const scalarSeen = new Set<string>();
  const loopColumns = new Map<string, Set<string>>();
  const loopOrder: string[] = [];

  for (const part of structuredTags) {
    const classified = classifyPart(part);
    if (classified.kind === "error") {
      throw new TemplateValidationError(classified.message);
    }
    if (classified.kind === "scalar") {
      if (!scalarSeen.has(classified.name)) {
        scalarSeen.add(classified.name);
        scalarNames.push(classified.name);
      }
      continue;
    }
    // Loop tag — possibly re-encountered (the same collection can
    // legitimately be looped over more than once in one document, e.g. a
    // summary table plus a detail section, as templates/masters/akt-vreda.docx
    // does with harmCategories) — merge columns across occurrences.
    let existing = loopColumns.get(classified.name);
    if (!existing) {
      existing = new Set<string>();
      loopColumns.set(classified.name, existing);
      loopOrder.push(classified.name);
    }
    for (const col of classified.columns) existing.add(col);
  }

  const loops: LoopField[] = loopOrder.map((name) => ({
    name,
    columns: Array.from(loopColumns.get(name)!),
  }));

  const fields: DetectedFields = { scalars: scalarNames, loops };

  runDryRenderSmokeTest(zip, fields);

  return fields;
}

function runDryRenderSmokeTest(zip: PizZip, fields: DetectedFields): void {
  const data: Record<string, unknown> = {};
  for (const name of fields.scalars) data[name] = `[${name}]`;
  for (const loop of fields.loops) {
    data[loop.name] = [1, 2].map((n) => Object.fromEntries(loop.columns.map((col) => [col, `[${col}_${n}]`])));
  }

  let doc: Docxtemplater;
  try {
    doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    doc.render(data);
  } catch (error) {
    throw new TemplateValidationError(formatDocxtemplaterError(error, "Шаблон не рендерится"));
  }

  const outBuf = doc.getZip().generate({ type: "nodebuffer" }) as Buffer;
  const renderedXml = new PizZip(outBuf).file("word/document.xml")!.asText();
  if (renderedXml.includes("{#") || renderedXml.includes("{/") || renderedXml.includes("{^")) {
    throw new TemplateValidationError("Шаблон отрендерился некорректно — не все циклы раскрылись");
  }
}

function formatDocxtemplaterError(error: unknown, prefix: string): string {
  const properties = (error as { properties?: { errors?: unknown[] } })?.properties;
  const errors = properties?.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    const details = errors
      .map((e) => {
        const err = e as { name?: string; message?: string; properties?: { explanation?: string } };
        return `${err.name ?? "Error"}: ${err.message ?? ""} (${err.properties?.explanation ?? ""})`;
      })
      .join("; ");
    return `${prefix}: ${details}`;
  }
  return `${prefix}: ${error instanceof Error ? error.message : String(error)}`;
}
