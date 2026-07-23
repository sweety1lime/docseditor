import { NextResponse } from "next/server";
import { buildScalarsSchema } from "@/lib/customTemplateValuesSchema";
import { getCustomTemplateFields, saveCustomTemplateScalars } from "@/lib/customTemplateRepo";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fields = await getCustomTemplateFields(Number(id));
  if (!fields) {
    return NextResponse.json({ error: "Шаблон не найден" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = buildScalarsSchema(fields.scalars).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  const template = await saveCustomTemplateScalars(Number(id), parsed.data);
  return NextResponse.json({ template });
}
