/**
 * Shared vocabulary for turning the human-readable placeholder phrases in the
 * source .docx masters into docxtemplater merge tags.
 *
 * The masters mark every placeholder run with `<w:highlight w:val="yellow"/>`
 * (visible in Word as yellow-highlighted text) — this lets us find every
 * scalar placeholder programmatically and safely, without guessing at which
 * of several identical-looking phrases (e.g. "ИНН" as both a label and a
 * value) is the one to replace.
 */

// Exact placeholder phrase (as authored, highlighted yellow) -> merge tag.
export const SCALAR_TAGS: Record<string, string> = {
  "Наименование юридического лица (полное)": "{org_full}",
  "Наименование юридического лица (сокращённое)": "{org_short}",
  "Адрес юридического лица": "{org_address}",
  "Электронная почта": "{org_email}",
  ИНН: "{org_inn}",
  ОГРН: "{org_ogrn}",
  // Single combined run in the УТВЕРЖДАЮ signature block: role + printed name.
  "Генеральный директор (Иванов И.И.)": "{director_signature_line}",
  // Signature-block line naming the PDn-responsible person (Акты use this;
  // Положение doesn't have this field inline at all).
  "Ответственный за ПДн (Иванов И.И.)": "{dpo_signature_line}",
  // Стray highlighted trailing space next to "Электронная почта" in Политика's
  // contact table (editing leftover in the source doc) — not a real
  // placeholder, just strip the highlight and leave the space as-is.
  " ": " ",
};

/**
 * Replaces the text content of every run whose rPr contains
 * `<w:highlight w:val="yellow"/>` with its mapped tag, and strips the
 * highlight so the rendered output doesn't retain a yellow background.
 * Runs whose text isn't in `SCALAR_TAGS` are left untouched but reported,
 * so unexpected placeholders surface instead of silently passing through.
 */
export function applyScalarTags(xml: string): { xml: string; replaced: number; unknown: string[] } {
  const unknown = new Set<string>();
  let replaced = 0;

  const runRe = /<w:r\b[^>]*>[\s\S]*?<\/w:r>/g;
  const out = xml.replace(runRe, (run) => {
    if (!run.includes('<w:highlight w:val="yellow"/>')) return run;

    const textMatch = run.match(/<w:t([^>]*)>([^<]*)<\/w:t>/);
    if (!textMatch) return run;

    const [full, attrs, text] = textMatch;
    const tag = SCALAR_TAGS[text];
    if (!tag) {
      unknown.add(text);
      return run;
    }

    replaced++;
    let next = run.replace(full, `<w:t${attrs}>${tag}</w:t>`);
    next = next.replace(/<w:highlight w:val="yellow"\/>/g, "");
    return next;
  });

  return { xml: out, replaced, unknown: [...unknown] };
}
