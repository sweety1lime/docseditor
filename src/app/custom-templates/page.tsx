import Link from "next/link";
import { listCustomTemplates } from "@/lib/customTemplateRepo";
import { isPdfSupported } from "@/lib/pdfSupport";
import { authEnabled } from "@/lib/session";
import { CustomTemplateUploadForm } from "@/components/CustomTemplateUploadForm";
import { CustomTemplateList } from "@/components/CustomTemplateList";
import { LogoutButton } from "@/components/LogoutButton";

// Reads live DB data on every request — same rationale as src/app/form/page.tsx.
export const dynamic = "force-dynamic";

export default async function CustomTemplatesPage() {
  const templates = await listCustomTemplates();
  const pdfSupported = await isPdfSupported();

  return (
    <div className="page" style={{ position: "relative" }}>
      {authEnabled() && <LogoutButton />}
      <h1 className="page-title">Свои шаблоны</h1>
      <p className="page-subtitle">
        Загрузите произвольный .docx со своими тегами — сайт найдёт поля и построит форму под них.
      </p>

      <nav className="mini-nav">
        <Link href="/form">← Пакет документов ПДн</Link>
      </nav>

      <CustomTemplateUploadForm />

      <section className="section">
        <h2>Загруженные шаблоны</h2>
        <CustomTemplateList templates={templates} pdfSupported={pdfSupported} />
      </section>
    </div>
  );
}
