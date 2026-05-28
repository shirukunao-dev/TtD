import mammoth from 'mammoth';

/**
 * Lightweight DOCX preview (layout approximate). For production DOC/DOCX,
 * convert server-side to PDF (LibreOffice, Gotenberg, CloudConvert).
 */
export async function docxToHtml(arrayBuffer) {
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return result.value;
}

export const DOC_GUIDANCE = `Word (.doc/.docx) files are best converted to PDF before signing.
Options: export from Word, use a convert API (LibreOffice/Gotenberg/CloudConvert),
or enable the optional DOCX preview below (layout may differ from the original).`;
