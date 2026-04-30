import type { Request, Response } from "express";
import PDFDocument from "pdfkit";
import { fail, ok } from "../../utils/apiResponse.js";
import { PDF_UNICODE_FONT_PATH } from "../../utils/pdfFont.js";
import * as svc from "./article.service.js";

function stripArticleMarkup(content: string) {
  return content
    .replace(/\r\n/g, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, "$1")
    .replace(/^#{2,3}\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/^\s*-\s+/gm, "- ")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .trim();
}

export async function listPublished(req: Request, res: Response): Promise<void> {
  const uid = req.session.userId!;
  const role = req.session.role!;
  const rows = await svc.listPublished(uid, role);
  ok(res, rows);
}

export async function listMine(req: Request, res: Response): Promise<void> {
  const uid = req.session.userId!;
  const rows = await svc.listMine(uid);
  ok(res, rows);
}

export async function listTrash(req: Request, res: Response): Promise<void> {
  const uid = req.session.userId!;
  const rows = await svc.listTrash(uid);
  ok(res, rows);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const uid = req.session.userId!;
  const role = req.session.role!;
  const a = await svc.getArticleContentForUser(id, uid, role);
  if (!a) {
    fail(res, 404, "Məqalə tapılmadı", "NOT_FOUND");
    return;
  }
  ok(res, a);
}

export async function create(req: Request, res: Response): Promise<void> {
  const uid = req.session.userId!;
  const a = await svc.createArticle(uid, req.body);
  ok(res, a, 201);
}

export async function importFromLink(req: Request, res: Response): Promise<void> {
  try {
    const imported = await svc.importArticleFromLink(req.body);
    ok(res, imported);
  } catch (error) {
    if (error instanceof svc.ArticleImportError) {
      fail(res, error.status, error.message, error.code);
      return;
    }
    throw error;
  }
}

export async function importFromFile(req: Request, res: Response): Promise<void> {
  const file = req.file;
  if (!file?.buffer) {
    fail(res, 400, "PDF və ya DOCX faylı tələb olunur", "VALIDATION");
    return;
  }

  try {
    const imported = await svc.importArticleFromFile(file);
    ok(res, imported);
  } catch (error) {
    if (error instanceof svc.ArticleImportError) {
      fail(res, error.status, error.message, error.code);
      return;
    }
    throw error;
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  const uid = req.session.userId!;
  const a = await svc.updateArticle(req.params.id, uid, req.body);
  if (!a) {
    fail(res, 404, "Məqalə tapılmadı və ya icazə yoxdur", "NOT_FOUND");
    return;
  }
  ok(res, a);
}

export async function remove(req: Request, res: Response): Promise<void> {
  const uid = req.session.userId!;
  const okDel = await svc.deleteArticle(req.params.id, uid);
  if (!okDel) {
    fail(res, 404, "Məqalə tapılmadı və ya icazə yoxdur", "NOT_FOUND");
    return;
  }
  ok(res, { ok: true });
}

export async function removePermanently(req: Request, res: Response): Promise<void> {
  const uid = req.session.userId!;
  const okDel = await svc.permanentlyDeleteArticle(req.params.id, uid);
  if (!okDel) {
    fail(res, 404, "Məqalə zibil qutusunda tapılmadı və ya icazə yoxdur", "NOT_FOUND");
    return;
  }
  ok(res, { ok: true });
}

export async function restore(req: Request, res: Response): Promise<void> {
  const uid = req.session.userId!;
  const restored = await svc.restoreArticle(req.params.id, uid);
  if (!restored) {
    fail(res, 404, "Məqalə zibil qutusunda tapılmadı və ya icazə yoxdur", "NOT_FOUND");
    return;
  }
  ok(res, restored);
}

export async function exportPdf(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const uid = req.session.userId!;
  const role = req.session.role!;
  const article = await svc.getArticleContentForUser(id, uid, role);

  if (!article) {
    fail(res, 404, "Məqalə tapılmadı", "NOT_FOUND");
    return;
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${article.slug}.pdf"`);

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);
  doc.font(PDF_UNICODE_FONT_PATH);

  doc.fontSize(20).text(article.title, { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor("#4b5563").text(`Status: ${article.status}`);
  doc.text(`Yenilənib: ${new Date(article.updatedAt).toLocaleString("az-AZ")}`);
  if (article.tags.length) {
    doc.text(`Teqlər: ${article.tags.join(", ")}`);
  }
  if (article.link) {
    doc.text(`Mənbə: ${article.link}`);
  }
  doc.fillColor("#111827");
  doc.moveDown();
  doc.fontSize(12).text(stripArticleMarkup(article.content), {
    lineGap: 4,
    paragraphGap: 8,
  });
  doc.end();
}
