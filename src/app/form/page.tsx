import { getOrganization } from "@/lib/organizationRepo";
import { availableDocumentKeys } from "@/lib/generateDocx";
import { isPdfSupported } from "@/lib/pdfSupport";
import { authEnabled } from "@/lib/session";
import { OrgRequisitesForm } from "@/components/OrgRequisitesForm";
import { PurposesSection } from "@/components/PurposesSection";
import { PdItemsSection } from "@/components/PdItemsSection";
import { IspdnSection } from "@/components/IspdnSection";
import { HarmCategoriesSection } from "@/components/HarmCategoriesSection";
import { GenerationPanel } from "@/components/GenerationPanel";
import { LogoutButton } from "@/components/LogoutButton";
import Link from "next/link";

// Reads live organization data on every request — must not be statically
// prerendered at build time (that would freeze in whatever data existed
// during the build and serve it to every visitor instead of live state).
export const dynamic = "force-dynamic";

export default async function FormPage() {
  const org = await getOrganization();
  const availableDocs = availableDocumentKeys();
  const pdfSupported = await isPdfSupported();
  const harmCategoryItems = (org?.harmCategories ?? []).map((h) => ({
    name: h.name,
    answers: JSON.parse(h.answers) as Record<string, boolean>,
  }));

  return (
    <div className="page" style={{ position: "relative" }}>
      {authEnabled() && <LogoutButton />}
      <h1 className="page-title">Шаблонизатор документов ПДн</h1>
      <p className="page-subtitle">
        Заполните данные один раз — пакет документов по 152-ФЗ сгенерируется автоматически.
      </p>

      <nav className="mini-nav">
        <a href="#requisites">Реквизиты</a>
        <a href="#purposes">Цели обработки</a>
        <a href="#pd-items">Перечень ПДн</a>
        <a href="#ispdn">Перечень ИСПДн</a>
        <a href="#harm-categories">Оценка вреда</a>
        <Link href="/custom-templates">Свои шаблоны</Link>
      </nav>

      <OrgRequisitesForm initial={org}/>
      <PurposesSection initialItems={org?.purposes ?? []} />
      <PdItemsSection initialItems={org?.pdItems ?? []} />
      <IspdnSection initialItems={org?.ispdnItems ?? []} />
      <HarmCategoriesSection initialItems={harmCategoryItems} />

      <GenerationPanel availableDocs={availableDocs} pdfSupported={pdfSupported} />
    </div>
  );
}
