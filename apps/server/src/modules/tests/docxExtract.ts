import mammoth from "mammoth";

function normalizeExtractedText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  const text = normalizeExtractedText(result.value ?? "");
  if (text.length < 20) {
    throw new Error("DOCX-dən kifayət qədər mətn çıxarılmadı");
  }
  return text;
}
