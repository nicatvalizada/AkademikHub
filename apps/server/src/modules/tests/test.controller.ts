import type { TestCreateInput, TestSourceKind } from "@akademik/shared";
import { testExportPayloadSchema } from "@akademik/shared";
import type { Request, Response } from "express";
import PDFDocument from "pdfkit";
import { fail, ok } from "../../utils/apiResponse.js";
import { PDF_UNICODE_FONT_PATH } from "../../utils/pdfFont.js";
import * as ai from "./aiTest.service.js";
import { extractTextFromDocx } from "./docxExtract.js";
import { extractTextFromPdf } from "./pdfExtract.js";
import * as svc from "./test.service.js";

export async function list(req: Request, res: Response): Promise<void> {
  const uid = req.session.userId!;
  const role = req.session.role!;
  const rows = await svc.listTests(uid, role);
  ok(res, rows);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const uid = req.session.userId!;
  const role = req.session.role!;
  const t = await svc.getTestForViewer(req.params.id, uid, role);
  if (!t) {
    fail(res, 404, "Test tapılmadı", "NOT_FOUND");
    return;
  }
  ok(res, t);
}

export async function stats(req: Request, res: Response): Promise<void> {
  const uid = req.session.userId!;
  const role = req.session.role!;
  const testStats = await svc.getTestStats(req.params.id, uid, role);
  if (!testStats) {
    fail(res, 404, "Test statistikası tapılmadı və ya icazə yoxdur", "NOT_FOUND");
    return;
  }
  ok(res, testStats);
}

export async function create(req: Request, res: Response): Promise<void> {
  const uid = req.session.userId!;
  try {
    const t = await svc.createTest(uid, req.body as TestCreateInput);
    ok(res, t, 201);
  } catch (e) {
    if (e instanceof Error && e.message === "INVALID_ARTICLE") {
      fail(res, 400, "Məqalə ID yanlışdır", "VALIDATION");
      return;
    }
    throw e;
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  const uid = req.session.userId!;
  const t = await svc.updateTest(req.params.id, uid, req.body as Partial<TestCreateInput>);
  if (!t) {
    fail(res, 404, "Test tapılmadı və ya icazə yoxdur", "NOT_FOUND");
    return;
  }
  ok(res, t);
}

export async function remove(req: Request, res: Response): Promise<void> {
  const uid = req.session.userId!;
  const okDel = await svc.deleteTest(req.params.id, uid);
  if (!okDel) {
    fail(res, 404, "Test tapılmadı və ya icazə yoxdur", "NOT_FOUND");
    return;
  }
  ok(res, { ok: true });
}

export async function submit(req: Request, res: Response): Promise<void> {
  const uid = req.session.userId!;
  try {
    const r = await svc.submitTest(req.params.id, uid, req.body as { answers: Record<string, unknown> });
    ok(res, r, 201);
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      fail(res, 404, "Test tapılmadı", "NOT_FOUND");
      return;
    }
    throw e;
  }
}

export async function importJson(req: Request, res: Response): Promise<void> {
  const uid = req.session.userId!;
  const file = req.file;
  if (!file?.buffer) {
    fail(res, 400, "JSON faylı tələb olunur", "VALIDATION");
    return;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(file.buffer.toString("utf8"));
  } catch {
    fail(res, 400, "JSON oxuna bilmədi", "VALIDATION");
    return;
  }
  const payload = testExportPayloadSchema.safeParse(parsed);
  if (!payload.success) {
    fail(res, 400, payload.error.errors.map((x) => x.message).join(", "), "VALIDATION");
    return;
  }
  const t = await svc.createFromImport(uid, payload.data, "import_json");
  ok(res, t, 201);
}

export async function importPdf(req: Request, res: Response): Promise<void> {
  const file = req.file;
  if (!file?.buffer) {
    fail(res, 400, "PDF faylı tələb olunur", "VALIDATION");
    return;
  }
  try {
    const extractedText = await extractTextFromPdf(file.buffer);
    ok(res, {
      fileName: file.originalname,
      extractedText,
      charCount: extractedText.length,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "PDF emalı uğursuz";
    fail(res, 400, msg, "PDF");
  }
}

export async function importDocx(req: Request, res: Response): Promise<void> {
  const file = req.file;
  if (!file?.buffer) {
    fail(res, 400, "DOCX faylı tələb olunur", "VALIDATION");
    return;
  }
  try {
    const extractedText = await extractTextFromDocx(file.buffer);
    ok(res, {
      fileName: file.originalname,
      extractedText,
      charCount: extractedText.length,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "DOCX emalı uğursuz";
    fail(res, 400, msg, "DOCX");
  }
}

export async function aiGenerate(req: Request, res: Response): Promise<void> {
  const uid = req.session.userId!;
  const role = req.session.role!;
  const input = req.body as {
    provider: "openai" | "gemini" | "deepseek";
    articleId?: string;
    text?: string;
    questionCount: number;
  };
  try {
    const text = await svc.resolveTextForAi(input.articleId, input.text, uid, role);
    const questions = await ai.generateQuestionsFromText(
      input.provider,
      text,
      input.questionCount,
    );
    const source: TestSourceKind =
      input.provider === "openai"
        ? "ai_openai"
        : input.provider === "gemini"
          ? "ai_gemini"
          : "ai_deepseek";
    ok(res, { questions, suggestedSource: source });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI xətası";
    if (msg === "ARTICLE_NOT_FOUND" || msg === "NO_SOURCE") {
      fail(res, 400, "Mənbə mətni tapılmadı", "VALIDATION");
      return;
    }
    if (msg.includes("API_KEY")) {
      fail(res, 503, msg, "AI_CONFIG");
      return;
    }
    fail(res, 502, msg, "AI");
  }
}

export async function exportJson(req: Request, res: Response): Promise<void> {
  const uid = req.session.userId!;
  const full = await svc.getTestFull(req.params.id);
  if (!full) {
    fail(res, 404, "Test tapılmadı", "NOT_FOUND");
    return;
  }
  if (full.createdBy !== uid && req.session.role !== "researcher") {
    fail(res, 403, "Yalnız yaradıcı və ya tədqiqatçı JSON export edə bilər", "FORBIDDEN");
    return;
  }
  const payload = svc.buildExportPayload(full);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="test-${full.id}.json"`);
  res.send(JSON.stringify(payload, null, 2));
}

export async function exportPdf(req: Request, res: Response): Promise<void> {
  const uid = req.session.userId!;
  const full = await svc.getTestFull(req.params.id);
  if (!full) {
    fail(res, 404, "Test tapılmadı", "NOT_FOUND");
    return;
  }
  if (full.createdBy !== uid && req.session.role !== "researcher") {
    fail(res, 403, "Yalnız yaradıcı və ya tədqiqatçı export edə bilər", "FORBIDDEN");
    return;
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="test-${full.id}.pdf"`);

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);
  doc.font(PDF_UNICODE_FONT_PATH);

  doc.fontSize(18).text(full.title, { underline: true });
  doc.moveDown();
  if (full.description) {
    doc.fontSize(11).fillColor("#444").text(full.description);
    doc.fillColor("#000");
    doc.moveDown();
  }

  full.questions.forEach((q, i) => {
    doc.fontSize(12).text(`${i + 1}. [${q.type}] ${q.prompt}`, { continued: false });
    if (q.options?.length) {
      q.options.forEach((opt, j) => {
        const mark = q.correctIndex === j ? " ✓" : "";
        doc.fontSize(10).text(`   ${String.fromCharCode(65 + j)}. ${opt}${mark}`);
      });
    }
    if (q.type === "true_false" && q.correctBoolean !== undefined) {
      doc.fontSize(10).text(`   Cavab: ${q.correctBoolean ? "Doğru" : "Yanlış"}`);
    }
    doc.fontSize(10).text(`   Xal: ${q.points}`);
    doc.moveDown(0.5);
  });

  doc.end();
}
