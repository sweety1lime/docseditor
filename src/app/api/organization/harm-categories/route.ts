import { NextResponse } from "next/server";
import { harmCategoriesSchema } from "@/lib/schema";
import { replaceHarmCategories, MissingOrganizationError } from "@/lib/organizationRepo";

export async function PUT(request: Request) {
  const body = await request.json();
  const parsed = harmCategoriesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const organization = await replaceHarmCategories(parsed.data);
    return NextResponse.json({ organization });
  } catch (error) {
    if (error instanceof MissingOrganizationError) {
      return NextResponse.json({ errors: { formErrors: [error.message] } }, { status: 409 });
    }
    throw error;
  }
}
