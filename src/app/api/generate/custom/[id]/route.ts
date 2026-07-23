import { NextResponse } from "next/server";
import { getCustomTemplate } from "@/lib/customTemplateRepo";
import { renderCustomTemplate } from "@/lib/customTemplateRender";
import { convertDocxToPdf } from "@/lib/convertToPdf";
import { isPdfSupported } from "@/lib/pdfSupport";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const template = await getCustomTemplate(Number(id));
  if (!template) {
    return NextResponse.json({ error: "Шаблон не найден" }, { status: 404 });
  }

  const format = new URL(request.url).searchParams.get("format") === "pdf" ? "pdf" : "docx";
  if (format === "pdf" && !(await isPdfSupported())) {
    return NextResponse.json({ error: "PDF недоступен в этом окружении — скачайте .docx" }, { status: 400 });
  }

  const docx = renderCustomTemplate(template.fileBytes, template.values);
  const buffer = format === "pdf" ? await convertDocxToPdf(docx) : docx;
  const contentType =
    format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const filename = `${template.name}.${format}`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
