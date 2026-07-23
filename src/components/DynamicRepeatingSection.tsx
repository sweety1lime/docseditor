"use client";

import { RepeatingSection } from "./RepeatingSection";
import { buildLoopRowSchema } from "@/lib/customTemplateValuesSchema";
import type { LoopField } from "@/lib/customTemplateTypes";

export function DynamicRepeatingSection({
  templateId,
  loop,
  initialItems,
}: {
  templateId: number;
  loop: LoopField;
  initialItems: Record<string, string>[];
}) {
  const emptyItem = Object.fromEntries(loop.columns.map((c) => [c, ""]));

  return (
    <RepeatingSection<Record<string, string>>
      id={`loop-${loop.name}`}
      title={loop.name}
      fields={loop.columns.map((c) => ({ name: c, label: c }))}
      itemSchema={buildLoopRowSchema(loop.columns)}
      emptyItem={emptyItem}
      initialItems={initialItems}
      saveUrl={`/api/custom-templates/${templateId}/loops/${encodeURIComponent(loop.name)}`}
      cardTitle={(_item, i) => `Запись ${i + 1}`}
      emptyCollectionMessage={`Добавьте хотя бы одну запись в «${loop.name}»`}
    />
  );
}
