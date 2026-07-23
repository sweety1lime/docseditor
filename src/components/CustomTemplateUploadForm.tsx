"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function CustomTemplateUploadForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setServerError("Выберите файл .docx");
      setStatus("error");
      return;
    }

    setStatus("uploading");
    setServerError(null);

    const formData = new FormData();
    formData.append("file", file);
    if (nameInputRef.current?.value.trim()) {
      formData.append("name", nameInputRef.current.value.trim());
    }

    const res = await fetch("/api/custom-templates", { method: "POST", body: formData });
    if (res.ok) {
      const body = await res.json();
      router.push(`/custom-templates/${body.template.id}`);
    } else {
      const body = await res.json().catch(() => null);
      setServerError(body?.errors?.formErrors?.[0] ?? "Не удалось загрузить шаблон");
      setStatus("error");
    }
  };

  return (
    <section className="section">
      <h2>Загрузить новый шаблон</h2>
      <p className="section-desc">
        .docx с тегами вида {"{tag}"} и таблицами {"{#list}...{/list}"} — сайт сам найдёт поля и построит форму.
      </p>
      <form onSubmit={onSubmit}>
        <div className="field-grid">
          <div className="field">
            <label htmlFor="custom-template-name">Название (необязательно)</label>
            <input id="custom-template-name" ref={nameInputRef} />
          </div>
          <div className="field">
            <label htmlFor="custom-template-file">Файл .docx</label>
            <input id="custom-template-file" type="file" accept=".docx" ref={fileInputRef} />
          </div>
        </div>
        <div className="row-actions">
          <button className="btn" type="submit" disabled={status === "uploading"}>
            {status === "uploading" ? "Загрузка…" : "Загрузить"}
          </button>
          {status === "error" && <span className="status-msg error">{serverError}</span>}
        </div>
      </form>
    </section>
  );
}
