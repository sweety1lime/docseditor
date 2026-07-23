"use client";

import { RepeatingSection } from "./RepeatingSection";
import { ispdnSchema, type IspdnInput } from "@/lib/schema";

const EMPTY: IspdnInput = {
  name: "",
  purpose: "",
  volume: "",
  subjectCategory: "",
  dataComposition: "",
  threatType: "",
  protectionLevel: "",
  location: "",
};

export function IspdnSection({ initialItems }: { initialItems: IspdnInput[] }) {
  return (
    <RepeatingSection<IspdnInput>
      id="ispdn"
      title="Перечень ИСПДн"
      description="Положение — Приложение №3."
      fields={[
        { name: "name", label: "Наименование ИСПДн" },
        { name: "purpose", label: "Назначение ИСПДн" },
        { name: "volume", label: "Объем обрабатываемых ПДн (количество субъектов ПДн)" },
        { name: "subjectCategory", label: "Категория субъектов ПДн" },
        { name: "dataComposition", label: "Состав ПДн", multiline: true },
        { name: "threatType", label: "Тип угроз безопасности ПДн" },
        { name: "protectionLevel", label: "Присвоенный уровень защищенности ИСПДн" },
        { name: "location", label: "Нахождение ИСПДн" },
      ]}
      itemSchema={ispdnSchema}
      emptyItem={EMPTY}
      initialItems={initialItems}
      saveUrl="/api/organization/ispdn"
      cardTitle={(item, i) => (item.name ? `${i + 1}. ${item.name}` : `ИСПДн ${i + 1}`)}
      emptyCollectionMessage="Добавьте хотя бы одну информационную систему"
    />
  );
}
