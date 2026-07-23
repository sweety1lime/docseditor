"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { harmCategorySchema, type HarmCategoryInput } from "@/lib/schema";
import { HARM_PARAMS, computeHarmDegree, type HarmLevel } from "@/lib/harmParams";

const LEVEL_LABELS: Record<HarmLevel, string> = {
  high: "Параметры, характеризующие высокую степень вреда",
  medium: "Параметры, характеризующие среднюю степень вреда",
  low: "Параметры, характеризующие низкую степень вреда",
};

const wrappedSchema = z.object({
  items: z.array(harmCategorySchema).min(1, "Добавьте хотя бы одну категорию субъектов для оценки вреда"),
});

const EMPTY: HarmCategoryInput = { name: "", answers: {} };

export function HarmCategoriesSection({ initialItems }: { initialItems: HarmCategoryInput[] }) {
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<{ items: HarmCategoryInput[] }>({
    resolver: zodResolver(wrappedSchema),
    defaultValues: { items: initialItems.length ? initialItems : [] },
  });

  const { fields: rows, append, remove, move } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items");

  const onSubmit = async (data: { items: HarmCategoryInput[] }) => {
    setStatus("saving");
    setServerError(null);
    const res = await fetch("/api/organization/harm-categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data.items),
    });
    if (res.ok) {
      setStatus("ok");
    } else {
      const body = await res.json().catch(() => null);
      setServerError(body?.errors?.formErrors?.[0] ?? "Не удалось сохранить данные");
      setStatus("error");
    }
  };

  const itemsError = (errors.items as unknown as { message?: string })?.message;

  return (
    <section id="harm-categories" className="section">
      <h2>Оценка вреда субъектам персональных данных</h2>
      <p className="section-desc">
        Акт оценки вреда (Приказ Роскомнадзора №178). Для каждой категории субъектов отметьте применимые
        параметры — степень вреда (высокая/средняя/низкая) рассчитывается автоматически: если применим
        хотя бы один параметр высокой степени — степень «Высокая»; иначе если применим параметр средней
        степени — «Средняя»; иначе — «Низкая».
      </p>
      {rows.length === 0 && <p className="empty-hint">Категорий пока нет — добавьте первую.</p>}

      <form onSubmit={handleSubmit(onSubmit)}>
        {rows.map((row, index) => {
          const currentAnswers = watchedItems?.[index]?.answers ?? {};
          const degree = computeHarmDegree(currentAnswers);
          return (
            <div className="card" key={row.id}>
              <div className="card-header">
                <span className="card-title">
                  {watchedItems?.[index]?.name || `Категория ${index + 1}`} — степень вреда: {degree}
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
                  <button type="button" className="icon-btn" title="Удалить категорию" onClick={() => remove(index)}>
                    ✕
                  </button>
                </div>
              </div>

              <div className="field" style={{ marginBottom: 14 }}>
                <label htmlFor={`harm-${index}-name`}>Категория субъектов персональных данных</label>
                <input
                  id={`harm-${index}-name`}
                  {...register(`items.${index}.name`)}
                  placeholder="Например: Работники, Уволенные работники"
                />
              </div>

              {(["high", "medium", "low"] as HarmLevel[]).map((level) => (
                <div key={level} className="harm-level-group">
                  <div className="harm-level-title">{LEVEL_LABELS[level]}</div>
                  {HARM_PARAMS.filter((p) => p.level === level).map((param) => (
                    <label className="harm-checkbox" key={param.code}>
                      <input type="checkbox" {...register(`items.${index}.answers.${param.code}`)} />
                      <span>{param.text}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          );
        })}

        {itemsError && <p className="field-error">{itemsError}</p>}

        <div className="row-actions">
          <button type="button" className="btn secondary" onClick={() => append(EMPTY)}>
            + Добавить категорию
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
