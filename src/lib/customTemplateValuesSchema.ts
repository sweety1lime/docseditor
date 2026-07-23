import { z } from "zod";

/**
 * Field names come from tags discovered in an arbitrary user-uploaded .docx,
 * so there's no way to author a meaningful Russian "заполните поле «X»"
 * message per field the way schema.ts does for the fixed documents — only
 * shape (every field is a string) is validated here, not non-emptiness.
 */
export function buildScalarsSchema(scalarNames: string[]): z.ZodType<Record<string, string>> {
  return z.object(Object.fromEntries(scalarNames.map((name) => [name, z.string()])));
}

export function buildLoopRowSchema(columns: string[]): z.ZodType<Record<string, string>> {
  return z.object(Object.fromEntries(columns.map((name) => [name, z.string()])));
}
