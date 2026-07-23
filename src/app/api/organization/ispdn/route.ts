import { NextResponse } from "next/server";
import { ispdnItemsSchema } from "@/lib/schema";
import { replaceIspdnItems, MissingOrganizationError } from "@/lib/organizationRepo";

export async function PUT(request: Request) {
  const body = await request.json();
  const parsed = ispdnItemsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const organization = await replaceIspdnItems(parsed.data);
    return NextResponse.json({ organization });
  } catch (error) {
    if (error instanceof MissingOrganizationError) {
      return NextResponse.json({ errors: { formErrors: [error.message] } }, { status: 409 });
    }
    throw error;
  }
}
