import { NextResponse } from "next/server";
import { getCustomTemplate, deleteCustomTemplate, CustomTemplateNotFoundError } from "@/lib/customTemplateRepo";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const template = await getCustomTemplate(Number(id));
  if (!template) {
    return NextResponse.json({ error: "Шаблон не найден" }, { status: 404 });
  }
  const { id: templateId, name, fileName, fields, values, createdAt, updatedAt } = template;
  return NextResponse.json({ template: { id: templateId, name, fileName, fields, values, createdAt, updatedAt } });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await deleteCustomTemplate(Number(id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof CustomTemplateNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
