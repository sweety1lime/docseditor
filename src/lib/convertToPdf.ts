import libre from "libreoffice-convert";

/**
 * Converts a docx buffer to PDF via a local LibreOffice install (headless
 * `soffice --convert-to pdf` under the hood). Isolated behind this one
 * function so the conversion mechanism (local binary vs. a containerized
 * service) can change later without touching callers.
 *
 * Requires LibreOffice installed locally (Windows dev: `winget install
 * TheDocumentFoundation.LibreOffice`). For deployment, bake LibreOffice into
 * the same Docker image as the Node app.
 */
export function convertDocxToPdf(docxBuffer: Buffer): Promise<Buffer> {
  const sofficeBinaryPaths = process.env.LIBREOFFICE_BINARY_PATH
    ? [process.env.LIBREOFFICE_BINARY_PATH]
    : undefined;

  return new Promise((resolve, reject) => {
    libre.convertWithOptions(
      docxBuffer,
      ".pdf",
      undefined,
      { sofficeBinaryPaths },
      (err, data) => {
        if (err) reject(err);
        else resolve(data);
      },
    );
  });
}
