import { DOCUMENT_LABELS, type DocumentKey } from "@/lib/generateDocx";

export function GenerationPanel({
  availableDocs,
  pdfSupported,
}: {
  availableDocs: DocumentKey[];
  pdfSupported: boolean;
}) {
  if (!availableDocs.length) {
    return (
      <div className="gen-bar">
        <span className="gen-bar-title">Документы пока не готовы к генерации.</span>
      </div>
    );
  }

  return (
    <div className="gen-bar">
      <span className="gen-bar-title">Скачать:</span>
      {availableDocs.map((key) => (
        <span className="gen-doc" key={key}>
          {DOCUMENT_LABELS[key]}
          <a className="link-btn" href={`/api/generate/${key}?format=docx`}>
            .docx
          </a>
          {pdfSupported && (
            <a className="link-btn" href={`/api/generate/${key}?format=pdf`}>
              .pdf
            </a>
          )}
        </span>
      ))}
      <a className="btn" href="/api/generate/package" style={{ textDecoration: "none" }}>
        Скачать всё ({pdfSupported ? "zip: docx+pdf" : "zip: docx"})
      </a>
    </div>
  );
}
