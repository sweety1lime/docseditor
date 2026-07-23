import { NextResponse } from "next/server";
import { getOrganization } from "@/lib/organizationRepo";

export async function GET() {
  const org = await getOrganization();
  return NextResponse.json({ organization: org });
}
