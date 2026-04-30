import { PDFParse } from "pdf-parse";

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const res = await parser.getText();
    const text = (res.text ?? "").trim();
    if (text.length < 20) {
      throw new Error("PDF-dən kifayət qədər mətn çıxarılmadı (boş və ya skan ola bilər)");
    }
    return text;
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}
