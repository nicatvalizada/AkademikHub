import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as testsApi from "@/api/tests";
import { Button } from "@/components/ui/Button";
import { useNotificationStore } from "@/store/notificationStore";
import { parseJsonTestFile, parsePdfTextToDraft } from "./testImport";

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

export function TestImportMenuButton({ backTo, className = "" }: Props) {
  const navigate = useNavigate();
  const notify = useNotificationStore((state) => state.notify);
  const [isOpen, setIsOpen] = useState(false);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const jsonInputRef = useRef<HTMLInputElement | null>(null);
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

  function openDraft(draft: Awaited<ReturnType<typeof parseJsonTestFile>>) {
    navigate("/app/tests/new", {
      state: {
        importedTestDraft: draft,
        testBackTo: backTo,
      },
    });
  }

  async function onJsonImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    setBusyLabel("JSON yüklənir…");
    setIsOpen(false);
    try {
      const draft = await parseJsonTestFile(file);
      notify(`${file.name} JSON faylı suallara dolduruldu.`);
      openDraft(draft);
    } catch (error) {
      const message = error instanceof Error ? error.message : "JSON oxunmadı";
      notify(message, "error");
    } finally {
      setBusyLabel(null);
      event.currentTarget.value = "";
    }
  }

  async function onPdfImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    setBusyLabel("PDF oxunur…");
    setIsOpen(false);
    try {
      const extracted = await testsApi.extractPdfText(file);
      const draft = parsePdfTextToDraft(extracted.extractedText, file.name);
      notify(
        draft.questions.length
          ? `${draft.questions.length} sual PDF-dən dolduruldu.`
          : "PDF oxundu, sual tapılmadı. Mətn AI üçün saxlanıldı.",
      );
      openDraft(draft);
    } catch (error) {
      const message = error instanceof Error ? error.message : "PDF oxunmadı";
      notify(message, "error");
    } finally {
      setBusyLabel(null);
      event.currentTarget.value = "";
    }
  }

  async function onDocxImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    setBusyLabel("DOCX oxunur…");
    setIsOpen(false);
    try {
      const extracted = await testsApi.extractDocxText(file);
      const draft = parsePdfTextToDraft(extracted.extractedText, file.name);
      notify(
        draft.questions.length
          ? `${draft.questions.length} sual DOCX-dən dolduruldu.`
          : "DOCX oxundu, sual tapılmadı. Mətn AI üçün saxlanıldı.",
      );
      openDraft(draft);
    } catch (error) {
      const message = error instanceof Error ? error.message : "DOCX oxunmadı";
      notify(message, "error");
    } finally {
      setBusyLabel(null);
      event.currentTarget.value = "";
    }
  }

  return (
    <div className={`file-import-menu ${className}`.trim()} ref={wrapRef}>
      <input
        ref={jsonInputRef}
        type="file"
        accept="application/json,.json"
        className="file-import-menu__input"
        onChange={(event) => void onJsonImport(event)}
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="file-import-menu__input"
        onChange={(event) => void onPdfImport(event)}
      />
      <input
        ref={docxInputRef}
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="file-import-menu__input"
        onChange={(event) => void onDocxImport(event)}
      />

      <Button
        type="button"
        className="tests-toolbar__button articles-toolbar__link-btn file-import-menu__trigger"
        onClick={() => setIsOpen((current) => !current)}
        disabled={!!busyLabel}
      >
        <span className="file-import-menu__trigger-icon" aria-hidden>
          <IconUpload />
        </span>
        <span>{busyLabel ?? "Yüklə"}</span>
      </Button>

      {isOpen ? (
        <div className="file-import-menu__popup" role="menu">
          <button
            type="button"
            className="file-import-menu__option"
            onClick={() => jsonInputRef.current?.click()}
          >
            .json
          </button>
          <button
            type="button"
            className="file-import-menu__option"
            onClick={() => pdfInputRef.current?.click()}
          >
            .pdf
          </button>
          <button
            type="button"
            className="file-import-menu__option"
            onClick={() => docxInputRef.current?.click()}
          >
            .docx
          </button>
        </div>
      ) : null}
    </div>
  );
}
