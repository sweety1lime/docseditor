import { NextResponse } from "next/server";
import { z } from "zod";
import { buildLoopRowSchema } from "@/lib/customTemplateValuesSchema";
import { getCustomTemplateFields, saveCustomTemplateLoopRows } from "@/lib/customTemplateRepo";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string; loopName: string }> }) {
  const { id, loopName: rawLoopName } = await params;
  const loopName = decodeURIComponent(rawLoopName);

  const fields = await getCustomTemplateFields(Number(id));
  if (!fields) {
    return NextResponse.json({ error: "Шаблон не найден" }, { status: 404 });
  }
  const loop = fields.loops.find((l) => l.name === loopName);
  if (!loop) {
    return NextResponse.json({ error: `Таблица «${loopName}» не найдена в этом шаблоне` }, { status: 404 });
  }

  const body = await request.json();
  const parsed = z.array(buildLoopRowSchema(loop.columns)).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  const template = await saveCustomTemplateLoopRows(Number(id), loopName, parsed.data);
  return NextResponse.json({ template });
}
