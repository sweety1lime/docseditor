"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { organizationSchema, type OrganizationInput } from "@/lib/schema";

const FIELDS: Array<{ name: keyof OrganizationInput; label: string; span2?: boolean }> = [
  { name: "fullName", label: "Наименование юридического лица (полное)", span2: true },
  { name: "shortName", label: "Наименование юридического лица (сокращённое)" },
  { name: "address", label: "Адрес юридического лица", span2: true },
  { name: "inn", label: "ИНН" },
  { name: "ogrn", label: "ОГРН" },
  { name: "email", label: "Электронная почта" },
  { name: "directorName", label: "Генеральный директор (например, Иванов И.И.)" },
  { name: "dpoName", label: "Ответственный за ПДн (например, Иванов И.И.)" },
];

export function OrgRequisitesForm({ initial }: { initial: OrganizationInput | null }) {
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrganizationInput>({
    resolver: zodResolver(organizationSchema),
    defaultValues: initial ?? {
      fullName: "",
      shortName: "",
      address: "",
      inn: "",
      ogrn: "",
      email: "",
      directorName: "",
      dpoName: "",
    },
  });

  const onSubmit = async (data: OrganizationInput) => {
    setStatus("saving");
    setServerError(null);
    const res = await fetch("/api/organization/requisites", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setStatus("ok");
    } else {
      const body = await res.json().catch(() => null);
      setServerError(body?.errors?.formErrors?.[0] ?? "Не удалось сохранить данные");
      setStatus("error");
    }
  };

  return (
    <section id="requisites" className="section">
      <h2>Реквизиты юридического лица</h2>
      <p className="section-desc">
        Эти данные подставляются во все документы пакета — заполните один раз.
      </p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="field-grid">
          {FIELDS.map((f) => (
            <div className={`field ${f.span2 ? "span-2" : ""}`} key={f.name}>
              <label htmlFor={f.name}>{f.label}</label>
              <input id={f.name} {...register(f.name)} />
              {errors[f.name] && <span className="field-error">{errors[f.name]?.message}</span>}
            </div>
          ))}
        </div>
        <div className="row-actions">
          <button className="btn" type="submit" disabled={status === "saving"}>
            {status === "saving" ? "Сохранение…" : "Сохранить реквизиты"}
          </button>
          {status === "ok" && <span className="status-msg ok">Сохранено</span>}
          {status === "error" && <span className="status-msg error">{serverError}</span>}
        </div>
      </form>
    </section>
  );
}
