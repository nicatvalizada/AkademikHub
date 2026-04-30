import type { ArticleStatus, IArticle } from "@akademik/shared";
import { stripArticleContent } from "./articleContent";

export type ArticleSortKey = "updated_desc" | "updated_asc" | "title_asc" | "title_desc";

export type ArticleFilterState = {
  query: string;
  tag: string;
  status: ArticleStatus | "";
  sort: ArticleSortKey;
};

export const DEFAULT_ARTICLE_FILTERS: ArticleFilterState = {
  query: "",
  tag: "",
  status: "",
  sort: "updated_desc",
};

export function getArticleTagOptions(articles: IArticle[]) {
  return Array.from(new Set(articles.flatMap((article) => article.tags.map((tag) => tag.trim()).filter(Boolean)))).sort(
    (left, right) => left.localeCompare(right, "az"),
  );
}

export function filterArticles(articles: IArticle[], filters: ArticleFilterState) {
  const query = filters.query.trim().toLocaleLowerCase("az");

  const filtered = articles.filter((article) => {
    if (filters.status && article.status !== filters.status) {
      return false;
    }

    if (filters.tag && !article.tags.some((tag) => tag.toLocaleLowerCase("az") === filters.tag.toLocaleLowerCase("az"))) {
      return false;
    }

    if (!query) return true;

    const haystack = [
      article.title,
      stripArticleContent(article.content),
      article.tags.join(" "),
    ]
      .join(" ")
      .toLocaleLowerCase("az");

    return haystack.includes(query);
  });

  return filtered.sort((left, right) => {
    switch (filters.sort) {
      case "updated_asc":
        return new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime();
      case "title_asc":
        return left.title.localeCompare(right.title, "az");
      case "title_desc":
        return right.title.localeCompare(left.title, "az");
      case "updated_desc":
      default:
        return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    }
  });
}
