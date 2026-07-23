"use client";

import { RepeatingSection } from "./RepeatingSection";
import { purposeSchema, type PurposeInput } from "@/lib/schema";

const EMPTY: PurposeInput = {
  purpose: "",
  subjectCategory: "",
  dataComposition: "",
  processingMethod: "",
  retentionPeriod: "",
  destructionProcedure: "",
  actionsList: "",
  legalBasis: "",
};

export function PurposesSection({ initialItems }: { initialItems: PurposeInput[] }) {
  return (
    <RepeatingSection<PurposeInput>
      id="purposes"
      title="Цели обработки персональных данных"
      description="Положение — Приложение №1; Политика — Приложение №1."
      fields={[
        { name: "purpose", label: "Цель обработки персональных данных", multiline: true },
        { name: "subjectCategory", label: "Наименование категории субъектов данных" },
        { name: "dataComposition", label: "Состав обрабатываемых персональных данных", multiline: true },
        { name: "processingMethod", label: "Способ обработки персональных данных" },
        { name: "retentionPeriod", label: "Срок обработки и хранения персональных данных" },
        {
          name: "destructionProcedure",
          label: "Порядок уничтожения персональных данных",
          multiline: true,
        },
        { name: "actionsList", label: "Перечень действий над персональными данными", multiline: true },
        { name: "legalBasis", label: "Правовое основание обработки персональных данных", multiline: true },
      ]}
      itemSchema={purposeSchema}
      emptyItem={EMPTY}
      initialItems={initialItems}
      saveUrl="/api/organization/purposes"
      cardTitle={(item, i) => (item.purpose ? `Цель ${i + 1}: ${item.purpose}` : `Цель ${i + 1}`)}
      emptyCollectionMessage="Добавьте хотя бы одну цель обработки"
    />
  );
}
