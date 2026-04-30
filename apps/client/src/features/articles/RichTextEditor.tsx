import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import {
  renderArticleContent,
  toggleOrderedListSelectedLines,
  togglePrefixSelectedLines,
  toggleWrapSelection,
  wrapSelection,
} from "./articleContent";

type Props = {
  value: string;
  onChange: (nextValue: string) => void;
};

function IconList() {
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
      <path d="M9 6h11" />
      <path d="M9 12h11" />
      <path d="M9 18h11" />
      <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconOrderedList() {
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
      <path d="M10 6h10" />
      <path d="M10 12h10" />
      <path d="M10 18h10" />
      <path d="M4 5h1v4" />
      <path d="M3.5 18h3" />
      <path d="M4 11.5c0-1 .7-1.5 1.5-1.5S7 10.6 7 11.5c0 .7-.5 1.3-1.2 1.8L4 15h3" />
    </svg>
  );
}

function IconQuote() {
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
      <path d="M10 8H6a2 2 0 00-2 2v4a2 2 0 002 2h2l2-4v-2a2 2 0 00-2-2z" />
      <path d="M20 8h-4a2 2 0 00-2 2v4a2 2 0 002 2h2l2-4v-2a2 2 0 00-2-2z" />
    </svg>
  );
}

function IconLink() {
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
      <path d="M10 13a5 5 0 007.54.54l2.92-2.92a5 5 0 10-7.07-7.08L11.5 5.4" />
      <path d="M14 11a5 5 0 00-7.54-.54L3.54 13.4a5 5 0 007.07 7.08l1.88-1.88" />
    </svg>
  );
}

export function RichTextEditor({ value, onChange }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  function applyChange(next: {
    nextValue: string;
    selectionStart: number;
    selectionEnd: number;
  }) {
    onChange(next.nextValue);
    window.requestAnimationFrame(() => {
      if (!textareaRef.current) return;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        next.selectionStart,
        next.selectionEnd,
      );
    });
  }

  function withSelection(
    transform: (
      selectionStart: number,
      selectionEnd: number,
    ) => {
      nextValue: string;
      selectionStart: number;
      selectionEnd: number;
    },
  ) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    applyChange(transform(textarea.selectionStart, textarea.selectionEnd));
  }

  function onInsertLink() {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const currentSelection =
      value.slice(textarea.selectionStart, textarea.selectionEnd).trim() ||
      "Link";
    const rawUrl = window.prompt("Link URL daxil edin", "https://");
    if (!rawUrl) return;

    const normalizedUrl = rawUrl.trim().startsWith("http")
      ? rawUrl.trim()
      : `https://${rawUrl.trim()}`;
    applyChange(
      wrapSelection(
        value,
        textarea.selectionStart,
        textarea.selectionEnd,
        `[`,
        `](${normalizedUrl})`,
        currentSelection,
      ),
    );
  }

  return (
    <div className="rich-text-editor">
      <div
        className="rich-text-editor__toolbar"
        aria-label="Mətn formatlama alətləri"
      >
        <Button
          type="button"
          variant="outline"
          className="rich-text-editor__tool"
          aria-label="Qalın"
          title="Qalın"
          onClick={() =>
            withSelection((start, end) =>
              toggleWrapSelection(value, start, end, "**", "Qalın mətn"),
            )
          }
        >
          <span
            className="rich-text-editor__icon rich-text-editor__icon--bold"
            aria-hidden
          >
            A
          </span>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rich-text-editor__tool"
          aria-label="İtalik"
          title="İtalik"
          onClick={() =>
            withSelection((start, end) =>
              toggleWrapSelection(value, start, end, "*", "Vurğulu mətn"),
            )
          }
        >
          <span
            className="rich-text-editor__icon rich-text-editor__icon--italic"
            aria-hidden
          >
            A
          </span>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rich-text-editor__tool"
          aria-label="Başlıq"
          title="Başlıq"
          onClick={() =>
            withSelection((start, end) =>
              togglePrefixSelectedLines(value, start, end, "## ", "Başlıq"),
            )
          }
        >
          <span
            className="rich-text-editor__icon rich-text-editor__icon--heading"
            aria-hidden
          >
            H
          </span>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rich-text-editor__tool"
          aria-label="Siyahı"
          title="Siyahı"
          onClick={() =>
            withSelection((start, end) =>
              togglePrefixSelectedLines(
                value,
                start,
                end,
                "- ",
                "Siyahı elementi",
              ),
            )
          }
        >
          <IconList />
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rich-text-editor__tool"
          aria-label="Nömrəli"
          title="Nömrəli"
          onClick={() =>
            withSelection((start, end) =>
              toggleOrderedListSelectedLines(
                value,
                start,
                end,
                "Siyahı elementi",
              ),
            )
          }
        >
          <IconOrderedList />
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rich-text-editor__tool"
          aria-label="Sitat"
          title="Sitat"
          onClick={() =>
            withSelection((start, end) =>
              togglePrefixSelectedLines(value, start, end, "> ", "Sitat"),
            )
          }
        >
          <IconQuote />
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rich-text-editor__tool"
          aria-label="Link"
          title="Link"
          onClick={onInsertLink}
        >
          <IconLink />
        </Button>
      </div>

      <label className="field">
        <span className="field__label">Məzmun</span>
        <textarea
          ref={textareaRef}
          className="field__input field__input--textarea rich-text-editor__input"
          rows={14}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
        />
      </label>

      <div className="rich-text-editor__preview">
        <p className="rich-text-editor__preview-label">Canlı önizləmə</p>
        <div className="rich-text-editor__preview-body">
          <div
            className="article-body article-body--rich"
            dangerouslySetInnerHTML={{ __html: renderArticleContent(value) }}
          />
        </div>
      </div>
    </div>
  );
}
