import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as articlesApi from "@/api/articles";
import { Button } from "@/components/ui/Button";
import { useNotificationStore } from "@/store/notificationStore";

function IconUpload() {
  return (
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
      <path d="M12 16V4" />
      <path d="M7 9l5-5 5 5" />
      <path d="M4 20h16" />
    </svg>
  );
}

type Props = {
  backTo: string;
  className?: string;
};

export function ArticleImportMenuButton({ backTo, className = "" }: Props) {
  const navigate = useNavigate();
  const notify = useNotificationStore((state) => state.notify);
  const [isOpen, setIsOpen] = useState(false);
  const [importingKind, setImportingKind] = useState<"pdf" | "docx" | null>(
    null,
  );
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const docxInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen]);

  async function handleImport(
    kind: "pdf" | "docx",
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    setIsOpen(false);
    setImportingKind(kind);

    try {
      const imported = await articlesApi.importArticleFromFile(file);
      const article = await articlesApi.createArticle({
        title: imported.title,
        content: imported.content,
        tags: imported.tags,
        status: "draft",
      });

      notify(`${file.name} faylından draft məqalə yaradıldı.`);
      navigate(`/app/articles/${article.id}/edit`, {
        state: { articleBackTo: backTo },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Fayl yüklənə bilmədi";
      notify(message, "error");
    } finally {
      setImportingKind(null);
      input.value = "";
    }
  }

  return (
    <div className={`file-import-menu ${className}`.trim()} ref={wrapRef}>
      <input
        ref={pdfInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="file-import-menu__input"
        onChange={(event) => void handleImport("pdf", event)}
      />
      <input
        ref={docxInputRef}
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="file-import-menu__input"
        onChange={(event) => void handleImport("docx", event)}
      />
      <Button
        type="button"
        variant="primary"
        className="file-import-menu__trigger"
        onClick={() => setIsOpen((current) => !current)}
        disabled={!!importingKind}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title="Məqaləni fayldan yüklə"
      >
        <span className="file-import-menu__trigger-icon" aria-hidden>
          <IconUpload />
        </span>
        <span>{importingKind ? "Yüklənir…" : "Yüklə"}</span>
      </Button>
      {isOpen ? (
        <div className="file-import-menu__popup" role="menu">
          <button
            type="button"
            className="file-import-menu__option"
            role="menuitem"
            onClick={() => pdfInputRef.current?.click()}
          >
            .pdf
          </button>
          <button
            type="button"
            className="file-import-menu__option"
            role="menuitem"
            onClick={() => docxInputRef.current?.click()}
          >
            .docx
          </button>
        </div>
      ) : null}
    </div>
  );
}
