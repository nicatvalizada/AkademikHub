import type { IArticle } from "@akademik/shared";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import * as articlesApi from "@/api/articles";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";
import { ArticleBookCard } from "./ArticleBookCard";
import { ArticleFilterBar } from "./ArticleFilterBar";
import {
  DEFAULT_ARTICLE_FILTERS,
  filterArticles,
  getArticleTagOptions,
} from "./articleFilters";

const ARCHIVE_BACK_STATE = { articleBackTo: "/app/articles/archive" as const };

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

export function ArchivePage() {
  const { user } = useAuth();
  const canWrite = !!user;
  const [list, setList] = useState<IArticle[]>([]);
  const [filters, setFilters] = useState(DEFAULT_ARTICLE_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const filteredList = useMemo(
    () => filterArticles(list, filters),
    [list, filters],
  );
  const tagOptions = useMemo(() => getArticleTagOptions(list), [list]);

  useEffect(() => {
    if (!canWrite) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await articlesApi.fetchMyArticles();
        if (!cancelled) {
          setList(rows.filter((a) => a.status === "archived"));
        }
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

  if (!canWrite) {
    return null;
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
      <div className="page-header" style={{ marginTop: "1rem" }}>
        <div>
          <h2 className="page-title">Arxivlənmiş məqalələr</h2>
          <p className="page-subtitle">
            Platformada gizlədilən və yadda saxlanılan materiallarınız
          </p>
        </div>
      </div>

      <section className="articles-toolbar">
        <div className="articles-toolbar__main">
          <label
            className="articles-toolbar__search"
            aria-label="Arxiv məqalə axtarışı"
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
              placeholder="Arxiv məqalə axtar"
            />
          </label>
          <div className="articles-toolbar__actions">
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

      {error ? <p className="field__error">{error}</p> : null}
      {filtersOpen ? (
        <ArticleFilterBar
          value={filters}
          onChange={setFilters}
          tagOptions={tagOptions}
          showSearch={false}
        />
      ) : null}

      {list.length === 0 && !error ? (
        <Card title="Boş arxiv">
          <p>Hələ arxivinizdə məqalə yoxdur.</p>
        </Card>
      ) : filteredList.length === 0 && !error ? (
        <Card title="Nəticə tapılmadı">
          <p style={{ color: "var(--text-secondary)" }}>
            Axtarış və filter seçimlərinə uyğun arxiv məqaləsi yoxdur.
          </p>
        </Card>
      ) : null}

      <div className="article-grid article-grid--books">
        {filteredList.map((a) => (
          <Link
            key={a.id}
            to={`/app/articles/${a.id}`}
            state={ARCHIVE_BACK_STATE}
            className="article-card-link"
          >
            <ArticleBookCard
              article={a}
              subtitle={`${a.status} · ${new Date(a.updatedAt).toLocaleDateString()}`}
              excerptLength={120}
              showTags={false}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
