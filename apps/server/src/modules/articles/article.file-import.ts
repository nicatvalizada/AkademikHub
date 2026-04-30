import { extname } from "node:path";
import mammoth from "mammoth";
import type {
  ArticleImportFileType,
  IArticleImportFromFileResult,
} from "@akademik/shared";
import { PDFParse } from "pdf-parse";
import { ArticleImportError } from "./article.import.js";

const MIN_IMPORTED_TEXT_LENGTH = 40;

function normalizeExtractedText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stripFileExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "");
}

function deriveTitle(text: string, fileName: string): string {
  const firstLine = text
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length >= 4 && line.length <= 120);

  const fallbackTitle = stripFileExtension(fileName)
    .replace(/[_-]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  return (firstLine || fallbackTitle || "Yeni məqalə").slice(0, 120);
}

function detectFileType(
  originalName: string,
  mimeType: string | undefined,
): ArticleImportFileType {
  const extension = extname(originalName).toLowerCase();
  const normalizedMimeType = (mimeType ?? "").toLowerCase();

  if (
    extension === ".pdf" ||
    normalizedMimeType === "application/pdf"
  ) {
    return "pdf";
  }

  if (
    extension === ".docx" ||
    normalizedMimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "docx";
  }

  throw new ArticleImportError(
    "Yalnız .pdf və .docx faylları dəstəklənir.",
    400,
    "ARTICLE_IMPORT_UNSUPPORTED_FILE",
  );
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return normalizeExtractedText(result.text ?? "");
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return normalizeExtractedText(result.value ?? "");
}

export async function importArticleFromFile(file: {
  buffer: Buffer;
  originalname: string;
  mimetype?: string;
}): Promise<IArticleImportFromFileResult> {
  const fileType = detectFileType(file.originalname, file.mimetype);
  const extractedText =
    fileType === "pdf"
      ? await extractTextFromPdf(file.buffer)
      : await extractTextFromDocx(file.buffer);

  if (extractedText.length < MIN_IMPORTED_TEXT_LENGTH) {
    throw new ArticleImportError(
      "Fayldan kifayət qədər mətn çıxarıla bilmədi.",
      400,
      "ARTICLE_IMPORT_EMPTY_FILE",
    );
  }

  return {
    title: deriveTitle(extractedText, file.originalname),
    content: extractedText,
    tags: [],
    fileName: file.originalname,
    fileType,
  };
}
