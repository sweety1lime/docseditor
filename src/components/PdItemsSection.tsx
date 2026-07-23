"use client";

import { RepeatingSection } from "./RepeatingSection";
import { pdItemSchema, type PdItemInput } from "@/lib/schema";

const EMPTY: PdItemInput = {
  subjectCategory: "",
  dataCategories: "",
  purpose: "",
  processingMethod: "",
  retentionPeriod: "",
};

export function PdItemsSection({ initialItems }: { initialItems: PdItemInput[] }) {
  return (
    <RepeatingSection<PdItemInput>
      id="pd-items"
      title="Перечень персональных данных"
      description="Положение — Приложение №2."
      fields={[
        { name: "subjectCategory", label: "Категории Субъектов ПДн" },
        { name: "dataCategories", label: "Категории и перечень ПДн", multiline: true },
        { name: "purpose", label: "Цель обработки" },
        { name: "processingMethod", label: "Способ обработки ПДн" },
        { name: "retentionPeriod", label: "Сроки обработки и хранения" },
      ]}
      itemSchema={pdItemSchema}
      emptyItem={EMPTY}
      initialItems={initialItems}
      saveUrl="/api/organization/pd-items"
      cardTitle={(item, i) => (item.subjectCategory ? `${i + 1}. ${item.subjectCategory}` : `Запись ${i + 1}`)}
      emptyCollectionMessage="Добавьте хотя бы одну запись в перечень ПДн"
    />
  );
}
