import {
  DEFAULT_ARTICLE_BOOK_ACCENT_COLOR,
  DEFAULT_ARTICLE_BOOK_COLOR,
  type IArticle,
} from "@akademik/shared";
import { getReadableTextColor, type BookColorVars } from "./bookColors";
import { stripArticleContent } from "./articleContent";

type ArticleBookCardProps = {
  article: IArticle;
  subtitle: string;
  excerptLength?: number;
  showExcerpt?: boolean;
  showTags?: boolean;
};

function getExcerpt(content: string, length: number) {
  const plainContent = stripArticleContent(content);

  if (plainContent.length <= length) {
    return plainContent;
  }

  return `${plainContent.slice(0, length).trim()}...`;
}

export function ArticleBookCard({
  article,
  subtitle,
  excerptLength = 140,
  showExcerpt = true,
  showTags = true,
}: ArticleBookCardProps) {
  const accentColor = article.bookAccentColor ?? DEFAULT_ARTICLE_BOOK_ACCENT_COLOR;
  const style: BookColorVars = {
    "--book-color": article.bookColor ?? DEFAULT_ARTICLE_BOOK_COLOR,
    "--book-accent-color": accentColor,
    "--book-label-color": getReadableTextColor(accentColor),
  };

  return (
    <article className="article-book-card" style={style}>
      <div className="article-book-card__book">
        <div className="article-book-card__pages" aria-hidden />
        <div className="article-book-card__cover">
          <span className="article-book-card__label">Məqalə</span>
          <h2 className="article-book-card__title">{article.title}</h2>
          <span className="article-book-card__accent" aria-hidden />
        </div>
      </div>
      <div className="article-book-card__meta">
        <h3 className="article-book-card__meta-title">{article.title}</h3>
        <p className="article-book-card__date">{subtitle}</p>
        {showExcerpt ? (
          <p className="article-book-card__excerpt">
            {getExcerpt(article.content, excerptLength)}
          </p>
        ) : null}
        {showTags && article.tags.length ? (
          <p className="tag-row">
            {article.tags.map((tag) => (
              <span key={tag} className="tag-pill">
                {tag}
              </span>
            ))}
          </p>
        ) : null}
      </div>
    </article>
  );
}
