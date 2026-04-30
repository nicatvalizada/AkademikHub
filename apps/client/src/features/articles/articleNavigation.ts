import type { ArticleStatus } from "@akademik/shared";

export type ArticleBackTo = "/app/articles" | "/app/articles/mine" | "/app/articles/archive";

type ArticleNavigationState = {
  articleBackTo?: ArticleBackTo;
};

const ARTICLE_BACK_PATHS = new Set<ArticleBackTo>([
  "/app/articles",
  "/app/articles/mine",
  "/app/articles/archive",
]);

export function getArticleBackToFromState(state: unknown): ArticleBackTo | undefined {
  if (!state || typeof state !== "object" || !("articleBackTo" in state)) {
    return undefined;
  }

  const value = (state as ArticleNavigationState).articleBackTo;
  return value && ARTICLE_BACK_PATHS.has(value) ? value : undefined;
}

export function getArticleBackToForStatus(status: ArticleStatus): ArticleBackTo {
  if (status === "archived") {
    return "/app/articles/archive";
  }

  if (status === "published") {
    return "/app/articles";
  }

  return "/app/articles/mine";
}
