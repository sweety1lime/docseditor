import { prisma } from "./db";
import { MissingOrganizationError } from "./organizationRepo";
import { emptyValuesFor } from "./customTemplateTypes";
import type {
  CustomTemplateDetail,
  CustomTemplateSummary,
  CustomTemplateValues,
  DetectedFields,
} from "./customTemplateTypes";

const SINGLETON_ID = 1;

export class CustomTemplateNotFoundError extends Error {
  constructor() {
    super("Шаблон не найден");
    this.name = "CustomTemplateNotFoundError";
  }
}

async function assertOrganizationExists() {
  const org = await prisma.organization.findUnique({ where: { id: SINGLETON_ID } });
  if (!org) throw new MissingOrganizationError();
}

function toSummary(row: {
  id: number;
  name: string;
  fileName: string;
  fields: unknown;
  createdAt: Date;
  updatedAt: Date;
}): CustomTemplateSummary {
  return {
    id: row.id,
    name: row.name,
    fileName: row.fileName,
    fields: row.fields as unknown as DetectedFields,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const summarySelect = {
  id: true,
  name: true,
  fileName: true,
  fields: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function listCustomTemplates(): Promise<CustomTemplateSummary[]> {
  const rows = await prisma.customTemplate.findMany({
    where: { organizationId: SINGLETON_ID },
    select: summarySelect,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toSummary);
}

export async function getCustomTemplateFields(id: number): Promise<DetectedFields | null> {
  const row = await prisma.customTemplate.findUnique({ where: { id }, select: { fields: true } });
  return row ? (row.fields as unknown as DetectedFields) : null;
}

export async function getCustomTemplate(
  id: number,
): Promise<(CustomTemplateDetail & { fileBytes: Buffer }) | null> {
  const row = await prisma.customTemplate.findUnique({ where: { id } });
  if (!row) return null;
  return {
    ...toSummary(row),
    values: row.values as unknown as CustomTemplateValues,
    fileBytes: Buffer.from(row.fileBytes),
  };
}

export async function createCustomTemplate(input: {
  name: string;
  fileName: string;
  fileBytes: Buffer;
  fields: DetectedFields;
}): Promise<CustomTemplateSummary> {
  await assertOrganizationExists();
  const row = await prisma.customTemplate.create({
    data: {
      organizationId: SINGLETON_ID,
      name: input.name,
      fileName: input.fileName,
      fileBytes: new Uint8Array(input.fileBytes),
      fields: input.fields as object,
      values: emptyValuesFor(input.fields) as object,
    },
    select: summarySelect,
  });
  return toSummary(row);
}

async function updateValues(
  id: number,
  mutate: (values: CustomTemplateValues) => CustomTemplateValues,
): Promise<CustomTemplateSummary> {
  const row = await prisma.customTemplate.findUnique({ where: { id }, select: { values: true } });
  if (!row) throw new CustomTemplateNotFoundError();
  const nextValues = mutate(row.values as unknown as CustomTemplateValues);
  const updated = await prisma.customTemplate.update({
    where: { id },
    data: { values: nextValues as object },
    select: summarySelect,
  });
  return toSummary(updated);
}

export async function saveCustomTemplateScalars(
  id: number,
  scalars: Record<string, string>,
): Promise<CustomTemplateSummary> {
  return updateValues(id, (values) => ({ ...values, scalars }));
}

export async function saveCustomTemplateLoopRows(
  id: number,
  loopName: string,
  rows: Record<string, string>[],
): Promise<CustomTemplateSummary> {
  return updateValues(id, (values) => ({
    ...values,
    loops: { ...values.loops, [loopName]: rows },
  }));
}

export async function deleteCustomTemplate(id: number): Promise<void> {
  try {
    await prisma.customTemplate.delete({ where: { id } });
  } catch {
    throw new CustomTemplateNotFoundError();
  }
}
