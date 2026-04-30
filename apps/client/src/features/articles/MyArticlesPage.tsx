import type { IArticle } from "@akademik/shared";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import * as articlesApi from "@/api/articles";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationStore } from "@/store/notificationStore";
import { ArticleBookCard } from "./ArticleBookCard";
import { ArticleFilterBar } from "./ArticleFilterBar";
import {
  DEFAULT_ARTICLE_FILTERS,
  filterArticles,
  getArticleTagOptions,
} from "./articleFilters";

const MY_ARTICLES_BACK_STATE = { articleBackTo: "/app/articles/mine" as const };

const ARTICLE_STATUS_LABELS: Record<IArticle["status"], string> = {
  draft: "Qaralama",
  published: "Dərc olunub",
  archived: "Arxiv",
};

function IconSearch() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function IconFilter() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 5h18l-7 8v5l-4 2v-7Z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

export function MyArticlesPage() {
  const { user } = useAuth();
  const notify = useNotificationStore((state) => state.notify);
  const canWrite = !!user;
  const [list, setList] = useState<IArticle[]>([]);
  const [filters, setFilters] = useState(DEFAULT_ARTICLE_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const filteredList = useMemo(
    () => filterArticles(list, filters),
    [list, filters],
  );
  const tagOptions = useMemo(() => getArticleTagOptions(list), [list]);

  function getArticleSubtitle(article: IArticle) {
    return `${ARTICLE_STATUS_LABELS[article.status]} · ${new Date(article.updatedAt).toLocaleDateString()}`;
  }

  useEffect(() => {
    if (!canWrite) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await articlesApi.fetchMyArticles();
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
  }, [canWrite]);

  useEffect(() => {
    if (!selectionMode) {
      setSelectedIds([]);
    }
  }, [selectionMode]);

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  async function onBulkTrash() {
    if (!selectedIds.length) {
      return;
    }

    if (
      !window.confirm(
        `${selectedIds.length} məqalə zibil qutusuna göndərilsin?`,
      )
    ) {
      return;
    }

    setBulkDeleting(true);
    setError(null);
    try {
      await Promise.all(selectedIds.map((id) => articlesApi.deleteArticle(id)));
      setList((current) =>
        current.filter((article) => !selectedIds.includes(article.id)),
      );
      notify(
        `${selectedIds.length} məqalə zibil qutusuna göndərildi.`,
        "danger",
      );
      setSelectionMode(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Məqalələr silinmədi.";
      setError(message);
      notify(message, "error");
    } finally {
      setBulkDeleting(false);
    }
  }

  if (!canWrite) {
    return <Navigate to="/app/articles" replace />;
  }

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
          <label
            className="articles-toolbar__search"
            aria-label="Məqalə axtarışı"
          >
            <span className="articles-toolbar__search-icon" aria-hidden>
              <IconSearch />
            </span>
            <input
              className="articles-toolbar__search-input"
              value={filters.query}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  query: event.target.value,
                }))
              }
              placeholder="Məqalə axtar"
            />
          </label>
          <div className="articles-toolbar__actions">
            <div className="articles-toolbar__links">
              {selectionMode ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    className="articles-toolbar__link-btn"
                    onClick={() => setSelectionMode(false)}
                    disabled={bulkDeleting}
                  >
                    Ləğv et
                  </Button>
                  <Button
                    type="button"
                    className="articles-toolbar__link-btn articles-toolbar__link-btn--danger"
                    onClick={() => void onBulkTrash()}
                    disabled={!selectedIds.length}
                    loading={bulkDeleting}
                  >
                    Seçilənləri sil ({selectedIds.length})
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  className="articles-toolbar__link-btn articles-toolbar__link-btn--danger"
                  onClick={() => setSelectionMode(true)}
                >
                  <IconTrash />
                  Zibil qutusu
                </Button>
              )}
            </div>
            <div
              className="articles-toolbar__icon-group"
              aria-label="Filterlər"
            >
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
      </section>
      {filtersOpen ? (
        <ArticleFilterBar
          value={filters}
          onChange={setFilters}
          tagOptions={tagOptions}
          showSearch={false}
          statusOptions={[
            { value: "", label: "Bütün statuslar" },
            { value: "draft", label: "Qaralama" },
            { value: "published", label: "Dərc" },
            { value: "archived", label: "Arxiv" },
          ]}
        />
      ) : null}
      {error ? <p className="field__error">{error}</p> : null}
      <div
        className={`article-grid${filteredList.length ? " article-grid--books" : ""}`}
      >
        {list.length === 0 ? (
          <Card title="Məqalə yoxdur">Hələ məqalə əlavə etməmisiniz.</Card>
        ) : filteredList.length === 0 ? (
          <Card title="Nəticə tapılmadı">
            Axtarış və filter seçimlərinə uyğun məqalə yoxdur.
          </Card>
        ) : (
          filteredList.map((a) =>
            selectionMode ? (
              <button
                key={a.id}
                type="button"
                className={`article-card-link article-card-link--button article-card-link--selectable${selectedIds.includes(a.id) ? " article-card-link--selected" : ""}`}
                onClick={() => toggleSelected(a.id)}
                aria-pressed={selectedIds.includes(a.id)}
              >
                <span className="article-card-link__select-badge" aria-hidden>
                  {selectedIds.includes(a.id) ? "✓" : ""}
                </span>
                <ArticleBookCard
                  article={a}
                  subtitle={getArticleSubtitle(a)}
                  excerptLength={120}
                  showTags={false}
                />
              </button>
            ) : (
              <Link
                key={a.id}
                to={`/app/articles/${a.id}`}
                state={MY_ARTICLES_BACK_STATE}
                className="article-card-link"
              >
                <ArticleBookCard
                  article={a}
                  subtitle={getArticleSubtitle(a)}
                  excerptLength={120}
                  showTags={false}
                />
              </Link>
            ),
          )
        )}
      </div>
      <p className="article-page-back">
        <Link to="/app/articles" className="btn btn--secondary">
          ← Dərc siyahısına
        </Link>
      </p>
    </div>
  );
}
