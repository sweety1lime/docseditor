import { NextResponse } from "next/server";
import { getOrganization } from "@/lib/organizationRepo";
import { renderDocx } from "@/lib/generateDocx";
import { convertDocxToPdf } from "@/lib/convertToPdf";
import { isPdfSupported } from "@/lib/pdfSupport";
import { toTemplateData } from "@/lib/templateData";
import { DOCUMENT_LABELS, availableDocumentKeys, type DocumentKey } from "@/lib/generateDocx";

export async function GET(request: Request, { params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  const key = doc as DocumentKey;

  if (!availableDocumentKeys().includes(key)) {
    return NextResponse.json({ error: `Документ "${doc}" ещё не доступен` }, { status: 404 });
  }

  const org = await getOrganization();
  if (!org) {
    return NextResponse.json(
      { error: "Сначала заполните и сохраните блок «Реквизиты юридического лица»" },
      { status: 409 },
    );
  }

  const format = new URL(request.url).searchParams.get("format") === "pdf" ? "pdf" : "docx";
  if (format === "pdf" && !(await isPdfSupported())) {
    return NextResponse.json(
      { error: "PDF недоступен в этом окружении — скачайте .docx" },
      { status: 400 },
    );
  }

  const docx = renderDocx(key, toTemplateData(org));
  const buffer = format === "pdf" ? await convertDocxToPdf(docx) : docx;
  const contentType =
    format === "pdf"
      ? "application/pdf"
      : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const filename = `${DOCUMENT_LABELS[key]}.${format}`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
