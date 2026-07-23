import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import type { TemplateData } from "./templateData";

const MASTERS_DIR = path.join(process.cwd(), "templates", "masters");

export type DocumentKey =
  | "polozhenie"
  | "politika"
  | "aktUnichtozheniya"
  | "zhurnalZayavleniy"
  | "zhurnalNositeley"
  | "soglasie"
  | "aktVreda";

export const DOCUMENT_FILES: Record<DocumentKey, string> = {
  polozhenie: "polozhenie.docx",
  politika: "politika.docx",
  aktUnichtozheniya: "akt-unichtozheniya.docx",
  zhurnalZayavleniy: "zhurnal-zayavleniy.docx",
  zhurnalNositeley: "zhurnal-nositeley.docx",
  soglasie: "soglasie.docx",
  aktVreda: "akt-vreda.docx",
};

export const DOCUMENT_LABELS: Record<DocumentKey, string> = {
  polozhenie: "Положение об организации обработки и защиты персональных данных",
  politika: "Политика обработки персональных данных",
  aktUnichtozheniya: "Акт уничтожения персональных данных",
  zhurnalZayavleniy: "Журнал учета заявлений ПДн",
  zhurnalNositeley: "Журнал учета машинных носителей ПДн",
  soglasie: "Согласие на обработку персональных данных (шаблон)",
  aktVreda: "Акт оценки вреда субъектам персональных данных",
};

/** Templates that currently exist on disk (re-authored masters ship one at a time). */
export function availableDocumentKeys(): DocumentKey[] {
  return (Object.keys(DOCUMENT_FILES) as DocumentKey[]).filter((key) =>
    fs.existsSync(path.join(MASTERS_DIR, DOCUMENT_FILES[key])),
  );
}

export function renderDocx(key: DocumentKey, data: TemplateData): Buffer {
  const file = DOCUMENT_FILES[key];
  if (!file) throw new Error(`Unknown document key: ${key}`);
  const filePath = path.join(MASTERS_DIR, file);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Template not found: ${filePath} (has it been re-authored yet?)`);
  }
  const buf = fs.readFileSync(filePath);
  const zip = new PizZip(buf);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  doc.render(data as unknown as Record<string, unknown>);
  return doc.getZip().generate({ type: "nodebuffer" });
}
