import { execFile } from "node:child_process";

/**
 * Whether PDF conversion is possible in this running environment — i.e.
 * whether a LibreOffice `soffice` binary is actually reachable. True on
 * local dev (LibreOffice installed) and the Docker image (baked in); false
 * on Vercel serverless, which has no way to run that binary. Checked once by
 * spawning `soffice --version` and cached for the lifetime of the process —
 * this is a deploy-time fact, not something that changes request to request.
 *
 * Deliberately not a hardcoded "is this Vercel" flag: it reflects the actual
 * capability, so any environment with LibreOffice available gets PDF for
 * free, and any environment without it fails safe (docx-only) automatically.
 */
let cached: Promise<boolean> | undefined;

export function isPdfSupported(): Promise<boolean> {
  if (!cached) cached = probe();
  return cached;
}

function probe(): Promise<boolean> {
  const binary = process.env.LIBREOFFICE_BINARY_PATH || "soffice";
  return new Promise((resolve) => {
    execFile(binary, ["--version"], { timeout: 5000 }, (error) => resolve(!error));
  });
}
