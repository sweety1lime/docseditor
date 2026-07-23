import { NextResponse } from "next/server";
import { purposesSchema } from "@/lib/schema";
import { replacePurposes, MissingOrganizationError } from "@/lib/organizationRepo";

export async function PUT(request: Request) {
  const body = await request.json();
  const parsed = purposesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const organization = await replacePurposes(parsed.data);
    return NextResponse.json({ organization });
  } catch (error) {
    if (error instanceof MissingOrganizationError) {
      return NextResponse.json({ errors: { formErrors: [error.message] } }, { status: 409 });
    }
    throw error;
  }
}
