import { NextResponse } from "next/server";
import { inspectAndValidateTemplate, TemplateValidationError, MAX_UPLOAD_BYTES } from "@/lib/customTemplateFields";
import { createCustomTemplate, listCustomTemplates } from "@/lib/customTemplateRepo";
import { MissingOrganizationError } from "@/lib/organizationRepo";

export async function GET() {
  const templates = await listCustomTemplates();
  return NextResponse.json({ templates });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ errors: { formErrors: ["Файл не найден в запросе"] } }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith(".docx")) {
    return NextResponse.json({ errors: { formErrors: ["Ожидается файл с расширением .docx"] } }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { errors: { formErrors: [`Файл слишком большой — максимум ${MAX_UPLOAD_BYTES / 1024 / 1024} МБ`] } },
      { status: 400 },
    );
  }

  const rawName = form.get("name");
  const name = typeof rawName === "string" && rawName.trim() ? rawName.trim() : file.name.replace(/\.docx$/i, "");

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const fields = inspectAndValidateTemplate(buffer);
    const template = await createCustomTemplate({ name, fileName: file.name, fileBytes: buffer, fields });
    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    if (error instanceof TemplateValidationError) {
      return NextResponse.json({ errors: { formErrors: [error.message] } }, { status: 400 });
    }
    if (error instanceof MissingOrganizationError) {
      return NextResponse.json({ errors: { formErrors: [error.message] } }, { status: 409 });
    }
    throw error;
  }
}
