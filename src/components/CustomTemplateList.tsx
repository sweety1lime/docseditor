"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CustomTemplateSummary } from "@/lib/customTemplateTypes";

export function CustomTemplateList({
  templates,
  pdfSupported,
}: {
  templates: CustomTemplateSummary[];
  pdfSupported: boolean;
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  if (templates.length === 0) {
    return <p className="empty-hint">Своих шаблонов пока нет — загрузите первый выше.</p>;
  }

  const onDelete = async (id: number) => {
    setDeletingId(id);
    await fetch(`/api/custom-templates/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div>
      {templates.map((t) => (
        <div className="card" key={t.id}>
          <div className="card-header">
            <span className="card-title">{t.name}</span>
            <div className="card-actions">
              <button
                type="button"
                className="icon-btn"
                title="Удалить шаблон"
                disabled={deletingId === t.id}
                onClick={() => onDelete(t.id)}
              >
                ✕
              </button>
            </div>
          </div>
          <div className="row-actions">
            <Link className="link-btn" href={`/custom-templates/${t.id}`}>
              Заполнить поля
            </Link>
            <div>
              <Link className="link-btn" href={`/api/generate/custom/${t.id}?format=docx`}>
                .docx
              </Link>
              {pdfSupported && (
                <Link className="link-btn" href={`/api/generate/custom/${t.id}?format=pdf`} style={{ marginLeft: 10 }}>
                  .pdf
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
