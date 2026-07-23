"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { buildScalarsSchema } from "@/lib/customTemplateValuesSchema";

export function CustomTemplateScalarsForm({
  templateId,
  scalarNames,
  initialValues,
}: {
  templateId: number;
  scalarNames: string[];
  initialValues: Record<string, string>;
}) {
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = buildScalarsSchema(scalarNames);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Record<string, string>>({
    resolver: zodResolver(schema),
    defaultValues: Object.fromEntries(scalarNames.map((name) => [name, initialValues[name] ?? ""])),
  });

  const onSubmit = async (data: Record<string, string>) => {
    setStatus("saving");
    setServerError(null);
    const res = await fetch(`/api/custom-templates/${templateId}/scalars`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setStatus("ok");
    } else {
      const body = await res.json().catch(() => null);
      const msg =
        body?.errors?.formErrors?.[0] ??
        body?.errors?.fieldErrors?.[Object.keys(body?.errors?.fieldErrors ?? {})[0]]?.[0] ??
        "Не удалось сохранить данные";
      setServerError(msg);
      setStatus("error");
    }
  };

  if (scalarNames.length === 0) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="field-grid">
        {scalarNames.map((name) => (
          <div className="field" key={name}>
            <label htmlFor={`scalar-${name}`}>{name}</label>
            <input id={`scalar-${name}`} {...register(name)} />
            {errors[name] && <span className="field-error">{errors[name]?.message as string}</span>}
          </div>
        ))}
      </div>
      <div className="row-actions">
        <button className="btn" type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Сохранение…" : "Сохранить поля"}
        </button>
        {status === "ok" && <span className="status-msg ok">Сохранено</span>}
        {status === "error" && <span className="status-msg error">{serverError}</span>}
      </div>
    </form>
  );
}
