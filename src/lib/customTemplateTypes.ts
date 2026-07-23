export interface LoopField {
  name: string;
  columns: string[];
}

export interface DetectedFields {
  scalars: string[];
  loops: LoopField[];
}

export interface CustomTemplateValues {
  scalars: Record<string, string>;
  loops: Record<string, Record<string, string>[]>;
}

export interface CustomTemplateSummary {
  id: number;
  name: string;
  fileName: string;
  fields: DetectedFields;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomTemplateDetail extends CustomTemplateSummary {
  values: CustomTemplateValues;
}

export function emptyValuesFor(fields: DetectedFields): CustomTemplateValues {
  return {
    scalars: Object.fromEntries(fields.scalars.map((name) => [name, ""])),
    loops: Object.fromEntries(fields.loops.map((loop) => [loop.name, []])),
  };
}
