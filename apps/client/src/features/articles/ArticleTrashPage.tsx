import type { IArticle } from "@akademik/shared";
import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import * as articlesApi from "@/api/articles";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationStore } from "@/store/notificationStore";
import { ArticleBookCard } from "./ArticleBookCard";
import { ArticleFilterBar } from "./ArticleFilterBar";
import { DEFAULT_ARTICLE_FILTERS, filterArticles, getArticleTagOptions } from "./articleFilters";

const TRASH_RETENTION_DAYS = 30;

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
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

function getTrashRetentionText(article: IArticle) {
  if (!article.deletedAt) {
    return `${TRASH_RETENTION_DAYS} gün ərzində avtomatik silinəcək`;
  }

  const deletedAt = new Date(article.deletedAt).getTime();
  const expiresAt = deletedAt + TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const daysLeft = Math.max(1, Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000)));
  return `${daysLeft} gün sonra avtomatik silinəcək`;
}

export function ArticleTrashPage() {
  const { user } = useAuth();
  const notify = useNotificationStore((state) => state.notify);
  const canWrite = !!user;
  const [list, setList] = useState<IArticle[]>([]);
  const [filters, setFilters] = useState(DEFAULT_ARTICLE_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const filteredList = useMemo(() => filterArticles(list, filters), [list, filters]);
  const tagOptions = useMemo(() => getArticleTagOptions(list), [list]);

  useEffect(() => {
    if (!canWrite) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await articlesApi.fetchTrashedArticles();
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

  async function onPermanentDelete(article: IArticle) {
    if (!window.confirm("Məqalə kalıcı silinsin?")) {
      return;
    }

    setDeletingId(article.id);
    setError(null);
    try {
      await articlesApi.permanentlyDeleteArticle(article.id);
      setList((current) => current.filter((item) => item.id !== article.id));
      notify("Məqalə kalıcı silindi.", "danger");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Məqalə silinmədi.";
      setError(message);
      notify(message, "error");
    } finally {
      setDeletingId(null);
    }
  }

  async function onRestore(article: IArticle) {
    setRestoringId(article.id);
    setError(null);
    try {
      await articlesApi.restoreArticle(article.id);
      setList((current) => current.filter((item) => item.id !== article.id));
      notify("Məqalə bərpa edildi.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Məqalə bərpa olunmadı.";
      setError(message);
      notify(message, "error");
    } finally {
      setRestoringId(null);
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
      <div className="page-header">
        <div>
          <h2 className="page-title">Zibil qutusu</h2>
          <p className="page-subtitle">Silinən məqalələr 30 gün sonra avtomatik silinir.</p>
        </div>
      </div>
      <section className="articles-toolbar">
        <div className="articles-toolbar__main">
          <label className="articles-toolbar__search" aria-label="Silinmiş məqalə axtarışı">
            <span className="articles-toolbar__search-icon" aria-hidden>
              <IconSearch />
            </span>
            <input
              className="articles-toolbar__search-input"
              value={filters.query}
              onChange={(event) =>
                setFilters((current) => ({ ...current, query: event.target.value }))
              }
              placeholder="Silinmiş məqalə axtar"
            />
          </label>
          <div className="articles-toolbar__actions">
            <div className="articles-toolbar__icon-group" aria-label="Filterlər">
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
      {list.length === 0 ? (
        <Card title="Zibil qutusu boşdur">Silinən məqalələr burada görünəcək.</Card>
      ) : filteredList.length === 0 ? (
        <Card title="Nəticə tapılmadı">Axtarış və filter seçimlərinə uyğun silinmiş məqalə yoxdur.</Card>
      ) : (
        <div className="article-grid article-grid--books">
          {filteredList.map((article) => (
            <div key={article.id} className="trash-article-card">
              <ArticleBookCard
                article={article}
                subtitle={article.deletedAt ? new Date(article.deletedAt).toLocaleDateString() : "Silinib"}
                excerptLength={90}
                showTags={false}
              />
              <p className="trash-article-card__hint">{getTrashRetentionText(article)}</p>
              <div className="page-actions">
                <Button
                  type="button"
                  variant="secondary"
                  loading={restoringId === article.id}
                  onClick={() => void onRestore(article)}
                >
                  Bərpa et
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  loading={deletingId === article.id}
                  onClick={() => void onPermanentDelete(article)}
                >
                  Kalıcı sil
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
