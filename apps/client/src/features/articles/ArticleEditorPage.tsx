import {
  DEFAULT_ARTICLE_BOOK_ACCENT_COLOR,
  DEFAULT_ARTICLE_BOOK_COLOR,
  type IArticle,
  type ArticleStatus,
} from "@akademik/shared";
import type { CSSProperties, FormEvent, KeyboardEvent } from "react";
import { useEffect, useState } from "react";
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import * as articlesApi from "@/api/articles";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationStore } from "@/store/notificationStore";
import {
  getArticleBackToForStatus,
  getArticleBackToFromState,
} from "./articleNavigation";
import { getReadableTextColor, type BookColorVars } from "./bookColors";
import { RichTextEditor } from "./RichTextEditor";

type EditorStep = "content" | "design";

const EDITOR_STEPS: Array<{ key: EditorStep; label: string }> = [
  { key: "content", label: "Məqalə" },
  { key: "design", label: "Üzlük dizaynı" },
];

const BOOK_COLOR_PRESETS = [
  "#2563eb",
  "#059669",
  "#dc2626",
  "#d97706",
  "#0f766e",
  "#334155",
  "#b45309",
];

const BOOK_ACCENT_COLOR_PRESETS = [
  "#f59e0b",
  "#22c55e",
  "#38bdf8",
  "#f97316",
  "#eab308",
  "#f8fafc",
  "#111827",
];

export function ArticleEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const notify = useNotificationStore((state) => state.notify);
  const canWrite = !!user;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<ArticleStatus>("draft");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null);
  const [link, setLink] = useState("");
  const [bookColor, setBookColor] = useState(DEFAULT_ARTICLE_BOOK_COLOR);
  const [bookAccentColor, setBookAccentColor] = useState(
    DEFAULT_ARTICLE_BOOK_ACCENT_COLOR,
  );
  const [editorStep, setEditorStep] = useState<EditorStep>("content");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importingLink, setImportingLink] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [tagError, setTagError] = useState<string | null>(null);
  const articleBackToFromState = getArticleBackToFromState(state);

  useEffect(() => {
    if (isNew || !id) return;
    let cancelled = false;
    (async () => {
      try {
        const a = await articlesApi.fetchArticle(id);
        if (cancelled) return;
        setTitle(a.title);
        setContent(a.content);
        setStatus(a.status);
        setTags(a.tags);
        setLink(a.link ?? "");
        setBookColor(a.bookColor ?? DEFAULT_ARTICLE_BOOK_COLOR);
        setBookAccentColor(
          a.bookAccentColor ?? DEFAULT_ARTICLE_BOOK_ACCENT_COLOR,
        );
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Xəta");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isNew]);

  function getValidHttpUrl(value: string): string | null {
    try {
      const parsed = new URL(value.trim());
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
        return null;
      parsed.hash = "";
      return parsed.toString();
    } catch {
      return null;
    }
  }

  async function importFromLink(nextUrl = link) {
    const parsedUrl = getValidHttpUrl(nextUrl);
    if (!parsedUrl) {
      setImportError("Düzgün məqalə linki daxil edin.");
      setImportNotice(null);
      return;
    }

    setImportingLink(true);
    setImportError(null);
    setImportNotice(null);
    setError(null);

    try {
      const imported = await articlesApi.importArticleFromLink(parsedUrl);
      setLink(imported.link);
      setTitle(imported.title);
      setContent(imported.content);
      setTags(imported.tags);
      setImportNotice("Başlıq, məzmun və teqlər linkdən dolduruldu.");
    } catch (err) {
      setImportError(
        err instanceof Error
          ? err.message
          : "Linkdən məqalə gətirmək mümkün olmadı.",
      );
    } finally {
      setImportingLink(false);
    }
  }

  function resetTagEditor() {
    setTagDraft("");
    setEditingTagIndex(null);
    setTagError(null);
  }

  function saveTagDraft() {
    const nextTag = tagDraft.trim().replace(/\s+/g, " ");
    if (!nextTag) {
      setTagError("Teq boş ola bilməz.");
      return false;
    }
    if (nextTag.length > 40) {
      setTagError("Teq maksimum 40 simvol ola bilər.");
      return false;
    }
    if (
      tags.some(
        (tag, index) =>
          tag.toLowerCase() === nextTag.toLowerCase() &&
          index !== editingTagIndex,
      )
    ) {
      setTagError("Bu teq artıq əlavə edilib.");
      return false;
    }
    if (editingTagIndex === null && tags.length >= 20) {
      setTagError("Maksimum 20 teq əlavə etmək olar.");
      return false;
    }

    if (editingTagIndex === null) {
      setTags((current) => [...current, nextTag]);
    } else {
      setTags((current) =>
        current.map((tag, index) =>
          index === editingTagIndex ? nextTag : tag,
        ),
      );
    }

    resetTagEditor();
    return true;
  }

  function editTag(index: number) {
    setTagDraft(tags[index] ?? "");
    setEditingTagIndex(index);
    setTagError(null);
  }

  function removeTag(indexToRemove: number) {
    setTags((current) => current.filter((_, index) => index !== indexToRemove));

    if (editingTagIndex === indexToRemove) {
      resetTagEditor();
      return;
    }
    if (editingTagIndex !== null && editingTagIndex > indexToRemove) {
      setEditingTagIndex(editingTagIndex - 1);
    }
  }

  function onTagInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      saveTagDraft();
    }
    if (e.key === "Escape") {
      resetTagEditor();
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (editorStep === "content") {
      if (tagDraft.trim() && !saveTagDraft()) {
        return;
      }
      setEditorStep("design");
      return;
    }

    setSaving(true);
    const navigateToArticle = (article: IArticle) => {
      navigate(`/app/articles/${article.id}`, {
        replace: true,
        state: {
          articleBackTo:
            articleBackToFromState ?? getArticleBackToForStatus(article.status),
        },
      });
    };
    const payload = {
      title,
      content,
      status,
      tags,
      bookColor,
      bookAccentColor,
      ...(link.trim() ? { link: link.trim() } : {}),
    };
    try {
      if (isNew) {
        const a = await articlesApi.createArticle(payload);
        notify("Məqalə yaradıldı.");
        navigateToArticle(a);
      } else if (id) {
        const a = await articlesApi.updateArticle(id, payload);
        notify("Məqalə yadda saxlanıldı.");
        navigateToArticle(a);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Xəta";
      setError(message);
      notify(message, "error");
    } finally {
      setSaving(false);
    }
  }

  const bookPreviewStyle: BookColorVars = {
    "--book-color": bookColor,
    "--book-accent-color": bookAccentColor,
    "--book-label-color": getReadableTextColor(bookAccentColor),
  };
  const activeStepIndex = EDITOR_STEPS.findIndex(
    (step) => step.key === editorStep,
  );
  const stepTrackerStyle = {
    "--article-editor-step-count": EDITOR_STEPS.length,
    "--article-editor-step-progress":
      EDITOR_STEPS.length > 1 ? activeStepIndex / (EDITOR_STEPS.length - 1) : 0,
  } as CSSProperties;

  if (!canWrite) {
    return <Navigate to="/app/articles" replace />;
  }

  if (!isNew && loading) {
    return (
      <div className="page-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-toolbar" style={{ marginBottom: "1rem" }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="btn btn--outline"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Geri
        </button>
      </div>
      <Card title={isNew ? "Yeni məqalə" : "Məqaləni redaktə et"}>
        <form onSubmit={onSubmit}>
          <div
            className="article-editor-steps"
            aria-label="Məqalə yaratma addımları"
            style={stepTrackerStyle}
          >
            {EDITOR_STEPS.map((step, index) => {
              const stateClass =
                index < activeStepIndex
                  ? " article-editor-step--complete"
                  : index === activeStepIndex
                    ? " article-editor-step--active"
                    : "";

              return (
                <div
                  key={step.key}
                  className={`article-editor-step${stateClass}`}
                  aria-current={index === activeStepIndex ? "step" : undefined}
                >
                  <span className="article-editor-step__marker" aria-hidden>
                    <span className="article-editor-step__marker-core" />
                  </span>
                  <span className="article-editor-step__label">
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {editorStep === "content" ? (
            <>
              <div className="field">
                <label className="field__label" htmlFor="article-link">
                  Məqalə linki (istəyə bağlı)
                </label>
                <div className="field__row">
                  <input
                    id="article-link"
                    className={`field__input ${importError ? "field__input--error" : ""}`.trim()}
                    type="url"
                    value={link}
                    onChange={(e) => {
                      setLink(e.target.value);
                      setImportError(null);
                      setImportNotice(null);
                    }}
                    placeholder="https://example.com/meqale"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="article-import-btn"
                    loading={importingLink}
                    onClick={() => void importFromLink()}
                  >
                    Linkdən doldur
                  </Button>
                </div>
                {importError ? (
                  <span className="field__error">{importError}</span>
                ) : null}
                {importNotice ? (
                  <span className="field__success">{importNotice}</span>
                ) : null}
              </div>
              <Input
                label="Başlıq"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <RichTextEditor value={content} onChange={setContent} />
              <label className="field">
                <span className="field__label">Status</span>
                <span className="source-select">
                  <select
                    className="field__input source-select__input"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ArticleStatus)}
                  >
                    <option value="draft">Qaralama</option>
                    <option value="published">Dərc</option>
                    <option value="archived">Arxiv</option>
                  </select>
                  <span className="source-select__icon" aria-hidden>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M7 10l5 5 5-5" />
                    </svg>
                  </span>
                </span>
              </label>
              <div className="field">
                <label className="field__label" htmlFor="article-tag-input">
                  Teqlər
                </label>
                <div className="tag-editor">
                  {tags.length ? (
                    <div
                      className="tag-editor__list"
                      aria-label="Məqalə teqləri"
                    >
                      {tags.map((tag, index) => (
                        <span
                          key={`${tag}-${index}`}
                          className="tag-editor__chip"
                        >
                          <button
                            type="button"
                            className="tag-editor__chip-edit"
                            onClick={() => editTag(index)}
                            aria-label={`${tag} teqini düzəlt`}
                          >
                            {tag}
                          </button>
                          <button
                            type="button"
                            className="tag-editor__chip-remove"
                            onClick={() => removeTag(index)}
                            aria-label={`${tag} teqini sil`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="tag-editor__input-row">
                    <input
                      id="article-tag-input"
                      className="field__input tag-editor__input"
                      value={tagDraft}
                      onChange={(e) => {
                        setTagDraft(e.target.value);
                        setTagError(null);
                      }}
                      onKeyDown={onTagInputKeyDown}
                      placeholder={
                        editingTagIndex === null
                          ? "Teq əlavə et"
                          : "Teqi düzəlt"
                      }
                      maxLength={40}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={saveTagDraft}
                    >
                      {editingTagIndex === null ? "Əlavə et" : "Dəyiş"}
                    </Button>
                    {editingTagIndex !== null ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={resetTagEditor}
                      >
                        Ləğv et
                      </Button>
                    ) : null}
                  </div>
                </div>
                {tagError ? (
                  <span className="field__error">{tagError}</span>
                ) : null}
              </div>
            </>
          ) : (
            <div className="book-color-editor">
              <div className="book-color-editor__controls">
                <label className="field">
                  <span className="field__label">Kitab rəngi</span>
                  <span className="book-color-input">
                    <input
                      className="book-color-input__picker"
                      type="color"
                      value={bookColor}
                      onChange={(e) => setBookColor(e.target.value)}
                      aria-label="Kitab rəngi"
                    />
                    <input
                      className="field__input"
                      value={bookColor}
                      readOnly
                      aria-label="Kitab rəng kodu"
                    />
                  </span>
                </label>
                <label className="field">
                  <span className="field__label">Vurğu rəngi</span>
                  <span className="book-color-input">
                    <input
                      className="book-color-input__picker"
                      type="color"
                      value={bookAccentColor}
                      onChange={(e) => setBookAccentColor(e.target.value)}
                      aria-label="Vurğu rəngi"
                    />
                    <input
                      className="field__input"
                      value={bookAccentColor}
                      readOnly
                      aria-label="Vurğu rəng kodu"
                    />
                  </span>
                </label>
                <div className="book-color-presets-group">
                  <p className="book-color-presets__label">Üzlük rəngləri</p>
                  <div
                    className="book-color-presets"
                    aria-label="Üzlük rəngləri"
                  >
                    {BOOK_COLOR_PRESETS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`book-color-preset${bookColor === color ? " book-color-preset--active" : ""}`}
                        style={{ background: color }}
                        onClick={() => setBookColor(color)}
                        aria-label={`${color} rəngini seç`}
                      />
                    ))}
                  </div>
                </div>
                <div className="book-color-presets-group">
                  <p className="book-color-presets__label">Detal rəngləri</p>
                  <div
                    className="book-color-presets"
                    aria-label="Detal rəngləri"
                  >
                    {BOOK_ACCENT_COLOR_PRESETS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`book-color-preset${bookAccentColor === color ? " book-color-preset--active" : ""}`}
                        style={{ background: color }}
                        onClick={() => setBookAccentColor(color)}
                        aria-label={`${color} vurğu rəngini seç`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div
                className="book-color-preview"
                style={bookPreviewStyle}
                aria-label="Kitab önizləməsi"
              >
                <div className="article-book-card__book article-book-card__book--preview">
                  <div className="article-book-card__pages" aria-hidden />
                  <div className="article-book-card__cover">
                    <span className="article-book-card__label">Məqalə</span>
                    <h2 className="article-book-card__title">
                      {title || "Məqalə adı"}
                    </h2>
                    <span className="article-book-card__accent" aria-hidden />
                  </div>
                </div>
              </div>
            </div>
          )}
          {error ? <p className="field__error">{error}</p> : null}
          <div className="article-editor-actions">
            {editorStep === "design" ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditorStep("content")}
              >
                Geri
              </Button>
            ) : null}
            <Button type="submit" loading={saving}>
              {editorStep === "content" ? "Üzlük dizaynına keç" : "Saxla"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
