import type {
  ArticleCreateInput,
  ArticleImportFromLinkInput,
  ArticleImportFromLinkResult,
  ArticleUpdateInput,
  IArticle,
} from "@akademik/shared";
import {
  DEFAULT_ARTICLE_BOOK_ACCENT_COLOR,
  DEFAULT_ARTICLE_BOOK_COLOR,
} from "@akademik/shared";
import mongoose from "mongoose";
import { UserModel } from "../users/user.model.js";
import {
  ArticleImportError,
  importArticleFromUrl,
} from "./article.import.js";
import { importArticleFromFile as importArticleFromUpload } from "./article.file-import.js";
import type { ArticleDoc } from "./article.model.js";
import { ArticleModel } from "./article.model.js";

const TRASH_RETENTION_MS = 1000 * 60 * 60 * 24 * 30;

function slugify(title: string): string {
  const s = title
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
  return s || "meqale";
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base || "meqale";
  let n = 0;
  for (;;) {
    const candidate = n === 0 ? slug : `${slug}-${n}`;
    const exists = await ArticleModel.exists({ slug: candidate });
    if (!exists) return candidate;
    n += 1;
  }
}

function toPublic(
  doc: ArticleDoc & { _id: unknown; createdAt?: Date; updatedAt?: Date },
): IArticle {
  return {
    id: String(doc._id),
    title: doc.title,
    slug: doc.slug,
    content: doc.content,
    authorId: String(doc.authorId),
    status: doc.status,
    tags: doc.tags ?? [],
    link: doc.link,
    bookColor: doc.bookColor ?? DEFAULT_ARTICLE_BOOK_COLOR,
    bookAccentColor: doc.bookAccentColor ?? DEFAULT_ARTICLE_BOOK_ACCENT_COLOR,
    deletedAt: doc.deletedAt?.toISOString(),
    createdAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: doc.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

async function purgeExpiredTrash(): Promise<void> {
  await ArticleModel.deleteMany({
    deletedAt: { $lte: new Date(Date.now() - TRASH_RETENTION_MS) },
  });
}

export async function listPublished(viewerId: string, viewerRole: string): Promise<IArticle[]> {
  const query: any = { status: "published", deletedAt: { $exists: false } };

  if (viewerRole === "student") {
    const staff = await UserModel.find({ role: { $in: ["teacher", "researcher"] } }, "_id").lean();
    const staffIds = staff.map(s => s._id);
    query.authorId = { $in: [...staffIds, new mongoose.Types.ObjectId(viewerId)] };
  }

  const rows = await ArticleModel.find(query).sort({ updatedAt: -1 }).lean();
  return rows.map((r) => toPublic(r as ArticleDoc & { _id: unknown }));
}

export async function listMine(authorId: string): Promise<IArticle[]> {
  const rows = await ArticleModel.find({
    authorId: new mongoose.Types.ObjectId(authorId),
    deletedAt: { $exists: false },
  })
    .sort({ updatedAt: -1 })
    .lean();
  return rows.map((r) => toPublic(r as ArticleDoc & { _id: unknown }));
}

export async function findById(id: string): Promise<IArticle | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const row = await ArticleModel.findOne({
    _id: id,
    deletedAt: { $exists: false },
  }).lean();
  if (!row) return null;
  return toPublic(row as ArticleDoc & { _id: unknown });
}

export async function listTrash(authorId: string): Promise<IArticle[]> {
  await purgeExpiredTrash();
  const rows = await ArticleModel.find({
    authorId: new mongoose.Types.ObjectId(authorId),
    deletedAt: { $exists: true },
  })
    .sort({ deletedAt: -1 })
    .lean();
  return rows.map((r) => toPublic(r as ArticleDoc & { _id: unknown }));
}

export async function createArticle(authorId: string, input: ArticleCreateInput): Promise<IArticle> {
  const slug = await uniqueSlug(slugify(input.title));
  const doc = await ArticleModel.create({
    title: input.title,
    slug,
    content: input.content,
    authorId: new mongoose.Types.ObjectId(authorId),
    status: input.status ?? "draft",
    tags: input.tags ?? [],
    ...(input.link ? { link: input.link } : {}),
    ...(input.bookColor ? { bookColor: input.bookColor } : {}),
    ...(input.bookAccentColor ? { bookAccentColor: input.bookAccentColor } : {}),
  });
  const lean = doc.toObject();
  return toPublic(lean as ArticleDoc & { _id: unknown });
}

export async function updateArticle(
  id: string,
  authorId: string,
  input: ArticleUpdateInput,
): Promise<IArticle | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const existing = await ArticleModel.findOne({
    _id: id,
    deletedAt: { $exists: false },
  }).lean();
  if (!existing) return null;
  if (String(existing.authorId) !== authorId) return null;

  const next: Record<string, unknown> = { ...input };
  if (input.title) {
    next.slug = await uniqueSlug(slugify(input.title));
  }
  const row = await ArticleModel.findOneAndUpdate(
    { _id: id, authorId: new mongoose.Types.ObjectId(authorId), deletedAt: { $exists: false } },
    { $set: next },
    { new: true, runValidators: true },
  ).lean();
  if (!row) return null;
  return toPublic(row as ArticleDoc & { _id: unknown });
}

export async function deleteArticle(id: string, authorId: string): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(id)) return false;
  const res = await ArticleModel.updateOne({
    _id: id,
    authorId: new mongoose.Types.ObjectId(authorId),
    deletedAt: { $exists: false },
  }, {
    $set: { deletedAt: new Date() },
  });
  return res.modifiedCount === 1;
}

export async function permanentlyDeleteArticle(id: string, authorId: string): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(id)) return false;
  const res = await ArticleModel.deleteOne({
    _id: id,
    authorId: new mongoose.Types.ObjectId(authorId),
    deletedAt: { $exists: true },
  });
  return res.deletedCount === 1;
}

export async function restoreArticle(id: string, authorId: string): Promise<IArticle | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const row = await ArticleModel.findOneAndUpdate(
    {
      _id: id,
      authorId: new mongoose.Types.ObjectId(authorId),
      deletedAt: { $exists: true },
    },
    { $unset: { deletedAt: 1 } },
    { new: true, runValidators: true },
  ).lean();

  if (!row) return null;
  return toPublic(row as ArticleDoc & { _id: unknown });
}

export async function getArticleContentForUser(
  id: string,
  userId: string,
  role: string,
): Promise<IArticle | null> {
  const a = await findById(id);
  if (!a) return null;
  if (a.status === "published") return a;
  if (a.authorId === userId) return a;
  if (role === "researcher") return a;
  return null;
}

export { ArticleImportError };

export async function importArticleFromLink(
  input: ArticleImportFromLinkInput,
): Promise<ArticleImportFromLinkResult> {
  return importArticleFromUrl(input.url);
}

export async function importArticleFromFile(file: {
  buffer: Buffer;
  originalname: string;
  mimetype?: string;
}) {
  return importArticleFromUpload(file);
}
