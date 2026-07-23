import { prisma } from "./db";
import type { OrganizationInput, PurposeInput, PdItemInput, IspdnInput, HarmCategoryInput } from "./schema";
import type { OrganizationWithCollections } from "./templateData";

const SINGLETON_ID = 1;

const include = { purposes: true, pdItems: true, ispdnItems: true, harmCategories: true } as const;

export async function getOrganization(): Promise<OrganizationWithCollections | null> {
  return prisma.organization.findUnique({ where: { id: SINGLETON_ID }, include });
}

export async function saveRequisites(data: OrganizationInput): Promise<OrganizationWithCollections> {
  return prisma.organization.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, ...data },
    update: { ...data },
    include,
  });
}

class MissingOrganizationError extends Error {
  constructor() {
    super("Сначала заполните и сохраните блок «Реквизиты юридического лица»");
    this.name = "MissingOrganizationError";
  }
}
export { MissingOrganizationError };

async function assertOrganizationExists() {
  const org = await prisma.organization.findUnique({ where: { id: SINGLETON_ID } });
  if (!org) throw new MissingOrganizationError();
}

/** Replaces the whole ordered collection in one transaction (delete-all then insert-all —
 * simplest correct approach for a small, wholly-resubmitted list from the form). */
export async function replacePurposes(items: PurposeInput[]): Promise<OrganizationWithCollections> {
  await assertOrganizationExists();
  await prisma.$transaction([
    prisma.purpose.deleteMany({ where: { organizationId: SINGLETON_ID } }),
    prisma.purpose.createMany({
      data: items.map((item, order) => ({ ...item, order, organizationId: SINGLETON_ID })),
    }),
  ]);
  return (await getOrganization())!;
}

export async function replacePdItems(items: PdItemInput[]): Promise<OrganizationWithCollections> {
  await assertOrganizationExists();
  await prisma.$transaction([
    prisma.pdItem.deleteMany({ where: { organizationId: SINGLETON_ID } }),
    prisma.pdItem.createMany({
      data: items.map((item, order) => ({ ...item, order, organizationId: SINGLETON_ID })),
    }),
  ]);
  return (await getOrganization())!;
}

export async function replaceIspdnItems(items: IspdnInput[]): Promise<OrganizationWithCollections> {
  await assertOrganizationExists();
  await prisma.$transaction([
    prisma.ispdn.deleteMany({ where: { organizationId: SINGLETON_ID } }),
    prisma.ispdn.createMany({
      data: items.map((item, order) => ({ ...item, order, organizationId: SINGLETON_ID })),
    }),
  ]);
  return (await getOrganization())!;
}

export async function replaceHarmCategories(items: HarmCategoryInput[]): Promise<OrganizationWithCollections> {
  await assertOrganizationExists();
  await prisma.$transaction([
    prisma.harmCategory.deleteMany({ where: { organizationId: SINGLETON_ID } }),
    prisma.harmCategory.createMany({
      data: items.map((item, order) => ({
        name: item.name,
        answers: JSON.stringify(item.answers),
        order,
        organizationId: SINGLETON_ID,
      })),
    }),
  ]);
  return (await getOrganization())!;
}
