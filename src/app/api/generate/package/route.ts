import { NextResponse } from "next/server";
import { getOrganization } from "@/lib/organizationRepo";
import { generatePackageZip } from "@/lib/generatePackage";
import { availableDocumentKeys } from "@/lib/generateDocx";

export async function GET() {
  const org = await getOrganization();
  if (!org) {
    return NextResponse.json(
      { error: "Сначала заполните и сохраните блок «Реквизиты юридического лица»" },
      { status: 409 },
    );
  }

  const keys = availableDocumentKeys();
  if (!keys.length) {
    return NextResponse.json({ error: "Нет доступных шаблонов документов" }, { status: 404 });
  }

  const zip = await generatePackageZip(keys, org);
  return new NextResponse(new Uint8Array(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="pdn-documents.zip"',
    },
  });
}
