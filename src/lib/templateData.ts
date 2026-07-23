import type { Organization, Purpose, PdItem, Ispdn, HarmCategory } from "@prisma/client";
import { HARM_PARAMS, computeHarmDegree, type HarmAnswers } from "./harmParams";

export type OrganizationWithCollections = Organization & {
  purposes: Purpose[];
  pdItems: PdItem[];
  ispdnItems: Ispdn[];
  harmCategories: HarmCategory[];
};

export interface TemplateData {
  org_full: string;
  org_short: string;
  org_address: string;
  org_inn: string;
  org_ogrn: string;
  org_email: string;
  director_signature_line: string;
  dpo_signature_line: string;
  purposes: Array<{
    nn: number;
    purpose: string;
    subjectCategory: string;
    dataComposition: string;
    processingMethod: string;
    retentionPeriod: string;
    destructionProcedure: string;
    actionsList: string;
    legalBasis: string;
  }>;
  pdItems: Array<{
    nn: number;
    subjectCategory: string;
    dataCategories: string;
    purpose: string;
    processingMethod: string;
    retentionPeriod: string;
  }>;
  ispdnItems: Array<{
    nn: number;
    name: string;
    purpose: string;
    volume: string;
    subjectCategory: string;
    dataComposition: string;
    threatType: string;
    protectionLevel: string;
    location: string;
  }>;
  // Each item also spreads one key per HARM_PARAMS code (h1..h6, m1..m5,
  // l1..l2) mapped to "осуществляется"/"не осуществляется" — see
  // harmCategoryToTags below. Left untyped here since the shape is derived
  // from HARM_PARAMS rather than hand-listed.
  harmCategories: Array<{ name: string; harmDegree: string } & Record<string, string>>;
}

// Sorted by the user-controlled `order` column, then renumbered 1..N for
// display — this keeps "N п/п" sequential even if rows were deleted/reordered
// and left gaps in the underlying `order` values.
function byOrder<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order);
}

function harmCategoryToTags(category: HarmCategory) {
  const answers: HarmAnswers = JSON.parse(category.answers);
  const paramTags: Record<string, string> = {};
  for (const p of HARM_PARAMS) {
    paramTags[p.code] = answers[p.code] ? "осуществляется" : "не осуществляется";
  }
  return { name: category.name, harmDegree: computeHarmDegree(answers), ...paramTags };
}

export function toTemplateData(org: OrganizationWithCollections): TemplateData {
  return {
    org_full: org.fullName,
    org_short: org.shortName,
    org_address: org.address,
    org_inn: org.inn,
    org_ogrn: org.ogrn,
    org_email: org.email,
    director_signature_line: `Генеральный директор ${org.directorName}`,
    dpo_signature_line: `Ответственный за ПДн ${org.dpoName}`,
    purposes: byOrder(org.purposes).map((p, i) => ({
      nn: i + 1,
      purpose: p.purpose,
      subjectCategory: p.subjectCategory,
      dataComposition: p.dataComposition,
      processingMethod: p.processingMethod,
      retentionPeriod: p.retentionPeriod,
      destructionProcedure: p.destructionProcedure,
      actionsList: p.actionsList,
      legalBasis: p.legalBasis,
    })),
    pdItems: byOrder(org.pdItems).map((p, i) => ({
      nn: i + 1,
      subjectCategory: p.subjectCategory,
      dataCategories: p.dataCategories,
      purpose: p.purpose,
      processingMethod: p.processingMethod,
      retentionPeriod: p.retentionPeriod,
    })),
    ispdnItems: byOrder(org.ispdnItems).map((p, i) => ({
      nn: i + 1,
      name: p.name,
      purpose: p.purpose,
      volume: p.volume,
      subjectCategory: p.subjectCategory,
      dataComposition: p.dataComposition,
      threatType: p.threatType,
      protectionLevel: p.protectionLevel,
      location: p.location,
    })),
    harmCategories: byOrder(org.harmCategories).map(harmCategoryToTags),
  };
}
