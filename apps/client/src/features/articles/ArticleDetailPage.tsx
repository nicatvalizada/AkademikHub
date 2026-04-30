import type { IArticle } from "@akademik/shared";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import * as articlesApi from "@/api/articles";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationStore } from "@/store/notificationStore";
import { getArticleBackToForStatus, getArticleBackToFromState } from "./articleNavigation";
import { renderArticleContent, stripArticleContent } from "./articleContent";

const ARTICLE_PREVIEW_CHAR_LIMIT = 1200;

export function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const notify = useNotificationStore((state) => state.notify);
  const [article, setArticle] = useState<IArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isArticleExpanded, setIsArticleExpanded] = useState(false);

  const isOwner = article && user && article.authorId === user.id;
  const canWrite = !!user;
  const articleBackTo = article
    ? getArticleBackToFromState(state) ?? getArticleBackToForStatus(article.status)
    : "/app/articles";
  const articlePlainText = article ? stripArticleContent(article.content) : "";
  const shouldCollapseArticle = articlePlainText.length > ARTICLE_PREVIEW_CHAR_LIMIT;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setIsArticleExpanded(false);
    (async () => {
      try {
        const a = await articlesApi.fetchArticle(id);
        if (!cancelled) setArticle(a);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Xəta");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function onDelete() {
    if (!id || !window.confirm("Silmək istədiyinizə əminsiniz?")) return;
    setDeleting(true);
    try {
      await articlesApi.deleteArticle(id);
      notify("Məqalə zibil qutusuna atıldı.", "danger");
      navigate("/app/articles/mine");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Xəta";
      setError(message);
      notify(message, "error");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="page-center">
        <Spinner />
      </div>
    );
  }

  if (error || !article) {
    return (
      <Card title="Xəta">
        <p>{error ?? "Tapılmadı"}</p>
        <Link to="/app/articles">Geri</Link>
      </Card>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-toolbar" style={{ marginBottom: "1rem" }}>
        <button type="button" onClick={() => navigate(articleBackTo)} className="btn btn--outline">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Geri
        </button>
      </div>
      <Card
        title={article.title}
        subtitle={`${article.status} · ${new Date(article.updatedAt).toLocaleString()}`}
      >
        {article.tags.length ? (
          <p className="tag-row" style={{ marginBottom: "1rem" }}>
            {article.tags.map((t) => (
              <span key={t} className="tag-pill">
                {t}
              </span>
            ))}
          </p>
        ) : null}
        {article.link ? (
          <p className="article-source-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ display: "inline", verticalAlign: "middle", marginRight: "0.35rem" }}>
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
            <a href={article.link} target="_blank" rel="noopener noreferrer">
              Mənbəyə keç
            </a>
          </p>
        ) : null}
        <div
          className={`article-body article-body--rich${shouldCollapseArticle && !isArticleExpanded ? " article-body--collapsed" : ""}`}
          dangerouslySetInnerHTML={{ __html: renderArticleContent(article.content) }}
        />
        {shouldCollapseArticle ? (
          <div className="article-body-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsArticleExpanded((current) => !current)}
            >
              {isArticleExpanded ? "Daha az göstər" : "Daha çox göstər"}
            </Button>
          </div>
        ) : null}
        {canWrite && isOwner ? (
          <div className="page-actions" style={{ marginTop: "1.5rem" }}>
            <Link to={`/app/articles/${article.id}/edit`} state={{ articleBackTo }}>
              <Button variant="secondary">Redaktə</Button>
            </Link>
            <Button variant="outline" loading={deleting} onClick={onDelete}>
              Sil
            </Button>
            <Link to={`/app/tests/new?articleId=${article.id}`}>
              <Button>Bu məqalədən test</Button>
            </Link>
          </div>
        ) : null}
        <div className="page-actions" style={{ marginTop: canWrite && isOwner ? "0.75rem" : "1.5rem" }}>
          <Button
            type="button"
            variant="outline"
            onClick={() => void articlesApi.downloadArticlePdf(article.id, `${article.slug}.pdf`)}
          >
            PDF yüklə
          </Button>
        </div>
      </Card>
    </div>
  );
}
