"use client";

import { useState } from "react";
import { useForm, useFieldArray, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z, type ZodTypeAny } from "zod";

export interface RepeatingFieldConfig {
  name: string;
  label: string;
  multiline?: boolean;
}

interface RepeatingSectionProps<T extends Record<string, string>> {
  id: string;
  title: string;
  description?: string;
  fields: RepeatingFieldConfig[];
  itemSchema: ZodTypeAny;
  emptyItem: T;
  initialItems: T[];
  saveUrl: string;
  cardTitle: (item: T, index: number) => string;
  emptyCollectionMessage: string;
}

export function RepeatingSection<T extends Record<string, string>>({
  id,
  title,
  description,
  fields,
  itemSchema,
  emptyItem,
  initialItems,
  saveUrl,
  cardTitle,
  emptyCollectionMessage,
}: RepeatingSectionProps<T>) {
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  const wrappedSchema = z.object({
    items: z.array(itemSchema).min(1, emptyCollectionMessage),
  });

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FieldValues>({
    resolver: zodResolver(wrappedSchema),
    defaultValues: { items: initialItems.length ? initialItems : [] },
  });

  const { fields: rows, append, remove, move } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items") as T[];

  const onSubmit = async (data: FieldValues) => {
    setStatus("saving");
    setServerError(null);
    const res = await fetch(saveUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data.items),
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

  const itemsErrors = (errors.items as unknown as { message?: string })?.message;

  return (
    <section id={id} className="section">
      <h2>{title}</h2>
      {description && <p className="section-desc">{description}</p>}
      {rows.length === 0 && <p className="empty-hint">Записей пока нет — добавьте первую.</p>}

      <form onSubmit={handleSubmit(onSubmit)}>
        {rows.map((row, index) => (
          <div className="card" key={row.id}>
            <div className="card-header">
              <span className="card-title">
                {cardTitle((watchedItems?.[index] as T) ?? emptyItem, index)}
              </span>
              <div className="card-actions">
                <button
                  type="button"
                  className="icon-btn"
                  title="Переместить выше"
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  title="Переместить ниже"
                  disabled={index === rows.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  title="Удалить запись"
                  onClick={() => remove(index)}
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="field-grid">
              {fields.map((f) => (
                <div className={`field ${f.multiline ? "span-2" : ""}`} key={f.name}>
                  <label htmlFor={`${id}-${index}-${f.name}`}>{f.label}</label>
                  {f.multiline ? (
                    <textarea id={`${id}-${index}-${f.name}`} {...register(`items.${index}.${f.name}`)} />
                  ) : (
                    <input id={`${id}-${index}-${f.name}`} {...register(`items.${index}.${f.name}`)} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {itemsErrors && <p className="field-error">{itemsErrors}</p>}

        <div className="row-actions">
          <button type="button" className="btn secondary" onClick={() => append(emptyItem as never)}>
            + Добавить запись
          </button>
          <div>
            <button className="btn" type="submit" disabled={status === "saving"}>
              {status === "saving" ? "Сохранение…" : "Сохранить"}
            </button>
            {status === "ok" && <span className="status-msg ok">Сохранено</span>}
            {status === "error" && <span className="status-msg error">{serverError}</span>}
          </div>
        </div>
      </form>
    </section>
  );
}
