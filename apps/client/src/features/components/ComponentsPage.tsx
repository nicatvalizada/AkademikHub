import type { IArticle } from "@akademik/shared";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as articlesApi from "@/api/articles";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";

function extractHighlights(content: string): string[] {
  const lines = content.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const explicit = lines.filter((l) => /^[-•*]\s|^\d+\.\s/.test(l)).slice(0, 5);
  if (explicit.length >= 2) return explicit.map((l) => l.replace(/^[-•*\d.]+\s*/, ""));
  const sentences = content
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 30)
    .slice(0, 4);
  return sentences;
}

function readingTime(content: string): string {
  const words = content.split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} dəq`;
}

function ComponentCard({ article }: { article: IArticle }) {
  const highlights = extractHighlights(article.content);
  const time = readingTime(article.content);

  return (
    <div className="comp-card">
      <div className="comp-card__header">
        <h3 className="comp-card__title">{article.title}</h3>
        <span className="comp-card__meta">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
          </svg>
          {time}
        </span>
      </div>

      {article.tags.length ? (
        <div className="comp-card__tags">
          {article.tags.map((t) => (
            <span key={t} className="tag-pill">{t}</span>
          ))}
        </div>
      ) : null}

      {highlights.length ? (
        <ul className="comp-card__highlights">
          {highlights.map((h, i) => (
            <li key={i} className="comp-card__highlight-item">
              <span className="comp-card__bullet" aria-hidden />
              {h}
            </li>
          ))}
        </ul>
      ) : (
        <p className="comp-card__excerpt">{article.content.slice(0, 200)}…</p>
      )}

      <div className="comp-card__footer">
        <Link to={`/app/articles/${article.id}`} className="comp-card__read-btn">
          Ətraflı oxu
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
        {article.link ? (
          <a href={article.link} target="_blank" rel="noopener noreferrer" className="comp-card__source-btn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
            Mənbə
          </a>
        ) : null}
      </div>
    </div>
  );
}

export function ComponentsPage() {
  const { user } = useAuth();
  const canWrite = !!user;
  const [list, setList] = useState<IArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    return () => { cancelled = true; };
  }, []);

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
          <h2 className="page-title">Komponentlər</h2>
          <p className="page-subtitle">Hər məqalənin əsas məqamları — sürətli icmal</p>
        </div>
        {canWrite ? (
          <div className="page-actions articles-toolbar__links">
            <Link to="/app/articles/new" state={{ articleBackTo: "/app/components" }}>
              <Button className="articles-toolbar__link-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Yeni məqalə
              </Button>
            </Link>
          </div>
        ) : null}
      </div>

      {error ? <p className="field__error">{error}</p> : null}

      {list.length === 0 ? (
        <Card title="Məqalə tapılmadı">
          <p style={{ color: "var(--text-secondary)" }}>
            Hələ dərc olunmuş məqalə yoxdur. İstifadəçilər məqalə əlavə etdikdən sonra
            əsas məqamlar burada avtomatik görünəcək.
          </p>
        </Card>
      ) : (
        <div className="comp-grid">
          {list.map((article) => (
            <ComponentCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
