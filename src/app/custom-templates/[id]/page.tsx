import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomTemplate } from "@/lib/customTemplateRepo";
import { isPdfSupported } from "@/lib/pdfSupport";
import { authEnabled } from "@/lib/session";
import { CustomTemplateScalarsForm } from "@/components/CustomTemplateScalarsForm";
import { DynamicRepeatingSection } from "@/components/DynamicRepeatingSection";
import { LogoutButton } from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function CustomTemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const template = await getCustomTemplate(Number(id));
  if (!template) notFound();

  const pdfSupported = await isPdfSupported();

  return (
    <div className="page" style={{ position: "relative" }}>
      {authEnabled() && <LogoutButton />}
      <h1 className="page-title">{template.name}</h1>
      <p className="page-subtitle">{template.fileName}</p>

      <nav className="mini-nav">
        <Link href="/custom-templates">← Свои шаблоны</Link>
      </nav>

      <section className="section">
        <h2>Поля</h2>
        <CustomTemplateScalarsForm
          templateId={template.id}
          scalarNames={template.fields.scalars}
          initialValues={template.values.scalars}
        />
      </section>

      {template.fields.loops.map((loop) => (
        <DynamicRepeatingSection
          key={loop.name}
          templateId={template.id}
          loop={loop}
          initialItems={template.values.loops[loop.name] ?? []}
        />
      ))}

      <div className="gen-bar">
        <span className="gen-bar-title">Скачать:</span>
        <span className="gen-doc">
          {template.name}
          <Link className="link-btn" href={`/api/generate/custom/${template.id}?format=docx`}>
            .docx
          </Link>
          {pdfSupported && (
            <Link className="link-btn" href={`/api/generate/custom/${template.id}?format=pdf`}>
              .pdf
            </Link>
          )}
        </span>
      </div>
    </div>
  );
}
