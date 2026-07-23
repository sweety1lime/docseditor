import { NextResponse } from "next/server";
import { organizationSchema } from "@/lib/schema";
import { saveRequisites } from "@/lib/organizationRepo";

export async function PUT(request: Request) {
  const body = await request.json();
  const parsed = organizationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  }
  const organization = await saveRequisites(parsed.data);
  return NextResponse.json({ organization });
}
