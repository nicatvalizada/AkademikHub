import type { IArticle } from "@akademik/shared";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import * as articlesApi from "@/api/articles";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";
import { ArticleBookCard } from "./ArticleBookCard";
import { ArticleImportMenuButton } from "./ArticleImportMenuButton";
import {
  DEFAULT_ARTICLE_FILTERS,
  filterArticles,
  getArticleTagOptions,
} from "./articleFilters";

const ARTICLES_BACK_STATE = { articleBackTo: "/app/articles" as const };
const ARTICLE_VIEW_MODE_STORAGE_KEY = "akademik-articles-view-mode";

function getInitialArticleViewMode(): "grid" | "list" {
  if (typeof window === "undefined") {
    return "grid";
  }

  return window.localStorage.getItem(ARTICLE_VIEW_MODE_STORAGE_KEY) === "list"
    ? "list"
    : "grid";
}

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function IconList() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

function IconGrid() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function IconFilter() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 5h18l-7 8v5l-4 2v-7Z" />
    </svg>
  );
}

export function ArticlesPage() {
  const { user } = useAuth();
  const canWrite = !!user;
  const [list, setList] = useState<IArticle[]>([]);
  const [filters, setFilters] = useState(DEFAULT_ARTICLE_FILTERS);
  const [viewMode, setViewMode] = useState<"grid" | "list">(
    getInitialArticleViewMode,
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const filteredList = useMemo(
    () => filterArticles(list, filters),
    [list, filters],
  );
  const tagOptions = useMemo(() => getArticleTagOptions(list), [list]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await articlesApi.fetchPublishedArticles();
        if (!cancelled) setList(rows);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Xəta");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(ARTICLE_VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  if (loading) {
    return (
      <div className="page-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <section className="articles-toolbar">
        <div className="articles-toolbar__main">
          <label className="articles-toolbar__search" aria-label="Məqalə axtarışı">
            <span className="articles-toolbar__search-icon" aria-hidden>
              <IconSearch />
            </span>
            <input
              className="articles-toolbar__search-input"
              value={filters.query}
              onChange={(event) =>
                setFilters((current) => ({ ...current, query: event.target.value }))
              }
              placeholder="Məqalə axtar"
            />
          </label>
          <div className="articles-toolbar__actions">
            {canWrite ? (
              <div className="articles-toolbar__links">
                <Link to="/app/articles/new" state={ARTICLES_BACK_STATE}>
                  <Button className="articles-toolbar__link-btn">
                    + Yeni məqalə
                  </Button>
                </Link>
              </div>
            ) : null}
            {canWrite ? (
              <ArticleImportMenuButton
                backTo={ARTICLES_BACK_STATE.articleBackTo}
                className="articles-toolbar__upload"
              />
            ) : null}
            <div className="articles-toolbar__icon-group" aria-label="Görünüş və filter">
              <div
                className="articles-toolbar__view-toggle"
                data-view-mode={viewMode}
                role="group"
                aria-label="Məqalə görünüşü"
              >
                <button
                  type="button"
                  className={`articles-toolbar__view-toggle-btn${viewMode === "list" ? " articles-toolbar__view-toggle-btn--active" : ""}`}
                  onClick={() => setViewMode("list")}
                  aria-pressed={viewMode === "list"}
                  title="Siyahı görünüşü"
                >
                  <IconList />
                </button>
                <button
                  type="button"
                  className={`articles-toolbar__view-toggle-btn${viewMode === "grid" ? " articles-toolbar__view-toggle-btn--active" : ""}`}
                  onClick={() => setViewMode("grid")}
                  aria-pressed={viewMode === "grid"}
                  title="Grid görünüşü"
                >
                  <IconGrid />
                </button>
              </div>
              <button
                type="button"
                className={`articles-toolbar__icon-btn${filtersOpen ? " articles-toolbar__icon-btn--active" : ""}`}
                onClick={() => setFiltersOpen((current) => !current)}
                aria-pressed={filtersOpen}
                title="Filterlər"
              >
                <IconFilter />
              </button>
            </div>
          </div>
        </div>
        {filtersOpen ? (
          <div className="articles-toolbar__panel">
            <label className="field articles-toolbar__panel-field">
              <span className="field__label">Teq</span>
              <select
                className="field__input"
                value={filters.tag}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, tag: event.target.value }))
                }
              >
                <option value="">Bütün teqlər</option>
                {tagOptions.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </label>
            <label className="field articles-toolbar__panel-field">
              <span className="field__label">Sıralama</span>
              <select
                className="field__input"
                value={filters.sort}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    sort: event.target.value as typeof current.sort,
                  }))
                }
              >
                <option value="updated_desc">Ən yeni</option>
                <option value="updated_asc">Ən köhnə</option>
                <option value="title_asc">A-dan Z-yə</option>
                <option value="title_desc">Z-dən A-ya</option>
              </select>
            </label>
          </div>
        ) : null}
      </section>
      {error ? <p className="field__error">{error}</p> : null}
      <div
        className={[
          "article-grid",
          filteredList.length && viewMode === "grid" ? "article-grid--books" : "",
          viewMode === "list" ? "article-grid--list" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {list.length === 0 ? (
          <Card title="Məqalə tapılmadı">
            Bu kateqoriyada hələ məqalə yoxdur və ya dərc olunmayıb.
          </Card>
        ) : filteredList.length === 0 ? (
          <Card title="Nəticə tapılmadı">
            Axtarış və filter seçimlərinə uyğun məqalə yoxdur.
          </Card>
        ) : (
          filteredList.map((a) => (
            <Link
              key={a.id}
              to={`/app/articles/${a.id}`}
              state={ARTICLES_BACK_STATE}
              className="article-card-link"
            >
              <ArticleBookCard
                article={a}
                subtitle={`Əlavə edilmə: ${new Date(a.updatedAt).toLocaleDateString()}`}
                excerptLength={160}
                showExcerpt={false}
              />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
