export type ArticleStatus = "draft" | "published" | "archived";

export const DEFAULT_ARTICLE_BOOK_COLOR = "#2563eb";
export const DEFAULT_ARTICLE_BOOK_ACCENT_COLOR = "#f59e0b";

export interface IArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  authorId: string;
  status: ArticleStatus;
  tags: string[];
  link?: string;
  bookColor: string;
  bookAccentColor: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IArticleCreate {
  title: string;
  content: string;
  status?: ArticleStatus;
  tags?: string[];
  link?: string;
  bookColor?: string;
  bookAccentColor?: string;
}

export interface IArticleImportFromLinkResult {
  title: string;
  content: string;
  link: string;
  tags: string[];
}

export type ArticleImportFileType = "pdf" | "docx";

export interface IArticleImportFromFileResult {
  title: string;
  content: string;
  tags: string[];
  fileName: string;
  fileType: ArticleImportFileType;
}
