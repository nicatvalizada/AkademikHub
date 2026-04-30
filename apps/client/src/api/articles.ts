import type {
  ArticleCreateInput,
  IArticle,
  IArticleImportFromFileResult,
  IArticleImportFromLinkResult,
  ArticleUpdateInput,
} from "@akademik/shared";
import { api } from "./client";

type ApiOk<T> = { success: true; data: T };

export async function fetchPublishedArticles(): Promise<IArticle[]> {
  const { data } = await api.get<ApiOk<IArticle[]>>("/api/articles/published");
  return data.data;
}

export async function fetchMyArticles(): Promise<IArticle[]> {
  const { data } = await api.get<ApiOk<IArticle[]>>("/api/articles/mine");
  return data.data;
}

export async function fetchTrashedArticles(): Promise<IArticle[]> {
  const { data } = await api.get<ApiOk<IArticle[]>>("/api/articles/trash");
  return data.data;
}

export async function fetchArticle(id: string): Promise<IArticle> {
  const { data } = await api.get<ApiOk<IArticle>>(`/api/articles/${id}`);
  return data.data;
}

export async function createArticle(body: ArticleCreateInput): Promise<IArticle> {
  const { data } = await api.post<ApiOk<IArticle>>("/api/articles", body);
  return data.data;
}

export async function importArticleFromLink(url: string): Promise<IArticleImportFromLinkResult> {
  const { data } = await api.post<ApiOk<IArticleImportFromLinkResult>>(
    "/api/articles/import-from-link",
    { url },
  );
  return data.data;
}

export async function importArticleFromFile(file: File): Promise<IArticleImportFromFileResult> {
  const fd = new FormData();
  fd.append("file", file);
  const { data } = await api.post<ApiOk<IArticleImportFromFileResult>>(
    "/api/articles/import/file",
    fd,
  );
  return data.data;
}

export async function updateArticle(id: string, body: ArticleUpdateInput): Promise<IArticle> {
  const { data } = await api.patch<ApiOk<IArticle>>(`/api/articles/${id}`, body);
  return data.data;
}

export async function deleteArticle(id: string): Promise<void> {
  await api.delete(`/api/articles/${id}`);
}

export async function restoreArticle(id: string): Promise<IArticle> {
  const { data } = await api.post<ApiOk<IArticle>>(`/api/articles/${id}/restore`);
  return data.data;
}

export async function permanentlyDeleteArticle(id: string): Promise<void> {
  await api.delete(`/api/articles/${id}/permanent`);
}

export async function downloadArticlePdf(id: string, fileName: string): Promise<void> {
  const res = await api.get(`/api/articles/${id}/export.pdf`, { responseType: "blob" });
  const url = URL.createObjectURL(res.data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
