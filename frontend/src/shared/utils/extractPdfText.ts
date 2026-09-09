export interface PdfExtractResult {
  text: string;
  pages: string[];
}

export async function extractPdfContent(_file: File | Blob): Promise<PdfExtractResult> {
  throw new Error('PDF extraction is not available in this build');
}

export async function extractPdfText(file: File | Blob): Promise<string> {
  const { text } = await extractPdfContent(file);
  return text;
}
