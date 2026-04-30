import type {
  ArticleStatus,
  IArticle,
  ITest,
  QuestionType,
  TestCreateInput,
} from "@akademik/shared";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import * as articlesApi from "@/api/articles";
import * as testsApi from "@/api/tests";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationStore } from "@/store/notificationStore";
import {
  IMPORT_MC_OPTION_COUNT,
  parseJsonTestFile,
  parsePdfTextToDraft,
  type ImportedTestDraft,
} from "./testImport";

type QDraft = {
  type: QuestionType;
  prompt: string;
  options: string[];
  correctIndex?: number;
  correctBoolean?: boolean;
  points: number;
};

type CreationStep = 1 | 2 | 3;

const creationSteps: Array<{ id: CreationStep; title: string; hint: string }> =
  [
    { id: 1, title: "Əsas məlumat", hint: "Başlıq, təsvir və vaxt limiti" },
    {
      id: 2,
      title: "Mənbə və AI",
      hint: "JSON, PDF və ya AI ilə sual hazırlığı",
    },
    { id: 3, title: "Suallar", hint: "Son redaktə və testi yarat" },
  ];

const sourceLabels: Record<TestCreateInput["source"], string> = {
  manual: "Əl ilə",
  from_article: "Məqalədən",
  import_json: "JSON import",
  import_pdf: "PDF import",
  ai_openai: "AI OpenAI",
  ai_gemini: "AI Gemini",
  ai_deepseek: "AI DeepSeek",
  ai_other: "Digər AI",
};

function articleStatusLabel(status: ArticleStatus): string {
  switch (status) {
    case "draft":
      return "Qaralama";
    case "published":
      return "Dərc";
    case "archived":
      return "Arxiv";
    default:
      return status;
  }
}

function emptyMcq(): QDraft {
  return {
    type: "multiple_choice",
    prompt: "",
    options: Array.from({ length: IMPORT_MC_OPTION_COUNT }, () => ""),
    correctIndex: 0,
    points: 1,
  };
}

function normalizeMcqOptions(options?: string[]): string[] {
  const base = Array.isArray(options) ? [...options] : [];
  while (base.length < IMPORT_MC_OPTION_COUNT) {
    base.push("");
  }
  return base;
}

function emptyTf(): QDraft {
  return {
    type: "true_false",
    prompt: "",
    options: [],
    correctBoolean: true,
    points: 1,
  };
}

function emptyShort(): QDraft {
  return { type: "short_answer", prompt: "", options: [], points: 1 };
}

export function TestCreatePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: editingTestId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const notify = useNotificationStore((state) => state.notify);
  const canWrite = !!user;
  const isEditMode = !!editingTestId;
  const allowFreeStepNav = isEditMode;
  const importState =
    location.state && typeof location.state === "object"
      ? (location.state as {
          importedTestDraft?: ImportedTestDraft;
          testBackTo?: string;
        })
      : null;
  const importedDraft = !isEditMode
    ? importState?.importedTestDraft
    : undefined;
  const testBackTo =
    typeof importState?.testBackTo === "string" ? importState.testBackTo : null;
  const initialImportedPdfText = importedDraft?.pdfText?.trim() ?? "";
  const initialImportedQuestions = importedDraft?.questions ?? [];

  const initialArticleId = useMemo(
    () => searchParams.get("articleId") ?? "",
    [searchParams],
  );

  const [step, setStep] = useState<CreationStep>(
    allowFreeStepNav
      ? 3
      : initialImportedQuestions.length
        ? 3
        : initialImportedPdfText
          ? 2
          : 1,
  );
  const [title, setTitle] = useState(importedDraft?.title ?? "");
  const [description, setDescription] = useState(
    importedDraft?.description ?? "",
  );
  const [articleId, setArticleId] = useState(initialArticleId);
  const [source, setSource] = useState<TestCreateInput["source"]>(
    importedDraft?.source
      ? importedDraft.source
      : initialArticleId
        ? "from_article"
        : "manual",
  );
  const [timeLimit, setTimeLimit] = useState(
    importedDraft?.timeLimitMinutes
      ? String(importedDraft.timeLimitMinutes)
      : "",
  );
  const [questions, setQuestions] = useState<QDraft[]>(
    initialImportedQuestions.length ? initialImportedQuestions : [emptyMcq()],
  );
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pdfText, setPdfText] = useState(initialImportedPdfText);
  const [aiProvider, setAiProvider] = useState<
    "openai" | "gemini" | "deepseek"
  >("deepseek");
  const [aiCount, setAiCount] = useState(5);
  const [myArticles, setMyArticles] = useState<IArticle[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(
    () => !!initialArticleId.trim(),
  );
  const [articlesError, setArticlesError] = useState<string | null>(null);
  const [extraArticle, setExtraArticle] = useState<IArticle | null>(null);
  const [useSiteArticle, setUseSiteArticle] = useState(
    () => !!initialArticleId.trim() || isEditMode,
  );
  const [loadingExisting, setLoadingExisting] = useState(isEditMode);

  const questionCount = questions.length;
  const totalPoints = useMemo(
    () =>
      questions.reduce(
        (sum, q) =>
          sum + (Number.isFinite(q.points) && q.points > 0 ? q.points : 0),
        0,
      ),
    [questions],
  );

  useEffect(() => {
    if (!canWrite || !useSiteArticle) {
      if (!useSiteArticle) setArticlesLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setArticlesLoading(true);
      setArticlesError(null);
      try {
        const rows = await articlesApi.fetchMyArticles();
        if (!cancelled) setMyArticles(rows);
      } catch (err) {
        if (!cancelled) {
          setArticlesError(
            err instanceof Error ? err.message : "Məqalələr yüklənmədi",
          );
        }
      } finally {
        if (!cancelled) setArticlesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canWrite, useSiteArticle]);

  useEffect(() => {
    const id = articleId.trim();
    if (!id) {
      setExtraArticle(null);
      return;
    }
    if (!canWrite || !useSiteArticle) {
      return;
    }
    if (myArticles.some((a) => a.id === id)) {
      setExtraArticle(null);
      return;
    }
    let cancelled = false;
    articlesApi
      .fetchArticle(id)
      .then((a) => {
        if (!cancelled) setExtraArticle(a);
      })
      .catch(() => {
        if (!cancelled) setExtraArticle(null);
      });
    return () => {
      cancelled = true;
    };
  }, [articleId, myArticles, canWrite, useSiteArticle]);

  const articleSelectOptions = useMemo(() => {
    const list = [...myArticles];
    if (extraArticle && !list.some((a) => a.id === extraArticle.id)) {
      return [extraArticle, ...list];
    }
    return list;
  }, [myArticles, extraArticle]);

  const articleIdInPickerList = articleSelectOptions.some(
    (a) => a.id === articleId,
  );
  const articleSelectValue = articleIdInPickerList ? articleId : "";

  useEffect(() => {
    if (!editingTestId) {
      setLoadingExisting(false);
      return;
    }

    let cancelled = false;
    setLoadingExisting(true);
    setError(null);

    testsApi
      .fetchTest(editingTestId)
      .then((test: ITest) => {
        if (cancelled) return;
        setTitle(test.title);
        setDescription(test.description ?? "");
        setArticleId(test.articleId ?? "");
        setSource(test.source);
        setTimeLimit(
          test.timeLimitMinutes ? String(test.timeLimitMinutes) : "",
        );
        setQuestions(
          test.questions.length
            ? test.questions.map((question) => ({
                type: question.type,
                prompt: question.prompt,
                options:
                  question.type === "multiple_choice"
                    ? normalizeMcqOptions(question.options)
                    : [],
                correctIndex: question.correctIndex,
                correctBoolean: question.correctBoolean,
                points: question.points,
              }))
            : [emptyMcq()],
        );
        setUseSiteArticle(!!test.articleId);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Test yüklənmədi");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingExisting(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [editingTestId]);

  if (!canWrite) {
    return <Navigate to="/app/tests" replace />;
  }

  if (loadingExisting) {
    return (
      <div className="page-center">
        <Button type="button" variant="ghost" disabled>
          Yüklənir…
        </Button>
      </div>
    );
  }

  function handleBack() {
    if (testBackTo) {
      navigate(testBackTo, { replace: true });
      return;
    }
    navigate(-1);
  }

  function setQuestion(i: number, patch: Partial<QDraft>) {
    setQuestions((qs) => qs.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  }

  function onSourceChange(nextSource: TestCreateInput["source"]) {
    setSource(nextSource);
    if (nextSource === "ai_openai") setAiProvider("openai");
    if (nextSource === "ai_gemini") setAiProvider("gemini");
    if (nextSource === "ai_deepseek") setAiProvider("deepseek");
  }

  function onAiProviderChange(nextProvider: "openai" | "gemini" | "deepseek") {
    setAiProvider(nextProvider);
    if (
      source === "ai_openai" ||
      source === "ai_gemini" ||
      source === "ai_deepseek"
    ) {
      setSource(
        nextProvider === "openai"
          ? "ai_openai"
          : nextProvider === "gemini"
            ? "ai_gemini"
            : "ai_deepseek",
      );
    }
  }

  function onUseSiteArticleToggle(checked: boolean) {
    setUseSiteArticle(checked);
    if (!checked) {
      setArticleId("");
      setExtraArticle(null);
      setSource((current) => (current === "from_article" ? "manual" : current));
    }
  }

  function validateBasics() {
    if (title.trim().length < 2) {
      return "Test başlığı ən azı 2 simvol olmalıdır.";
    }

    if (timeLimit.trim()) {
      const parsed = Number(timeLimit);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 480) {
        return "Vaxt limiti 1 ilə 480 dəqiqə arasında olmalıdır.";
      }
    }

    return null;
  }

  function validateQuestions() {
    if (questions.length === 0) {
      return "Ən azı bir sual əlavə edin.";
    }

    for (const [index, question] of questions.entries()) {
      const prompt = question.prompt.trim();

      if (!prompt) {
        return `Sual ${index + 1} üçün sual mətni daxil edin.`;
      }

      if (!Number.isFinite(question.points) || question.points < 1) {
        return `Sual ${index + 1} üçün xal 1 və ya daha böyük olmalıdır.`;
      }

      if (question.type === "multiple_choice") {
        const options = question.options
          .map((option) => option.trim())
          .filter(Boolean);
        const maxIndex = Math.max(options.length - 1, 0);

        if (options.length < 2) {
          return `Sual ${index + 1} üçün ən azı 2 variant lazımdır.`;
        }

        if (
          question.correctIndex === undefined ||
          !Number.isInteger(question.correctIndex) ||
          question.correctIndex < 0 ||
          question.correctIndex > maxIndex
        ) {
          return `Sual ${index + 1} üçün düzgün indeks 0-${maxIndex} aralığında olmalıdır.`;
        }
      }
    }

    return null;
  }

  function goToStep(nextStep: CreationStep) {
    if (nextStep === step) {
      return;
    }

    if (!allowFreeStepNav && nextStep > step && step === 1) {
      const validationMessage = validateBasics();
      if (validationMessage) {
        setError(validationMessage);
        return;
      }
    }

    setError(null);
    setStep(nextStep);
  }

  function onNextStep() {
    if (step === 1) {
      const validationMessage = validateBasics();
      if (validationMessage) {
        setError(validationMessage);
        return;
      }
    }

    setError(null);
    setStep((current) =>
      current < 3 ? ((current + 1) as CreationStep) : current,
    );
  }

  function applyImportedDraft(draft: ImportedTestDraft) {
    setTitle(draft.title);
    setDescription(draft.description);
    setSource(draft.source);
    setTimeLimit(draft.timeLimitMinutes ? String(draft.timeLimitMinutes) : "");
    setPdfText(draft.pdfText ?? "");
    setQuestions(draft.questions.length ? draft.questions : [emptyMcq()]);
    setError(null);
    setStep(draft.questions.length ? 3 : draft.pdfText ? 2 : 1);
  }

  async function onImportJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy("JSON import…");
    setError(null);
    try {
      const draft = await parseJsonTestFile(file);
      applyImportedDraft(draft);
      notify(`${file.name} JSON faylı suallara dolduruldu.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Xəta";
      setError(message);
      notify(message, "error");
    } finally {
      setBusy(null);
      e.target.value = "";
    }
  }

  async function onPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy("PDF oxunur…");
    setError(null);
    try {
      const r = await testsApi.extractPdfText(file);
      const draft = parsePdfTextToDraft(r.extractedText, file.name);
      applyImportedDraft(draft);
      notify(
        draft.questions.length
          ? `${draft.questions.length} sual PDF-dən suallara dolduruldu.`
          : "PDF oxundu, sual tapılmadı. Mətn AI üçün saxlanıldı.",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Xəta";
      setError(message);
      notify(message, "error");
    } finally {
      setBusy(null);
      e.target.value = "";
    }
  }

  async function onDocx(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy("DOCX oxunur…");
    setError(null);
    try {
      const r = await testsApi.extractDocxText(file);
      const draft = parsePdfTextToDraft(r.extractedText, file.name);
      applyImportedDraft(draft);
      notify(
        draft.questions.length
          ? `${draft.questions.length} sual DOCX-dən suallara dolduruldu.`
          : "DOCX oxundu, sual tapılmadı. Mətn AI üçün saxlanıldı.",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Xəta";
      setError(message);
      notify(message, "error");
    } finally {
      setBusy(null);
      e.target.value = "";
    }
  }

  async function onAiFromPdfOrArticle() {
    if (!articleId.trim() && pdfText.trim().length < 20) {
      setError("AI üçün məqalə ID və ya ən azı 20 simvolluq mətn lazımdır.");
      return;
    }

    setBusy("AI suallar hazırlayır…");
    setError(null);
    try {
      const body = {
        provider: aiProvider,
        questionCount: aiCount,
        ...(articleId.trim() ? { articleId: articleId.trim() } : {}),
        ...(pdfText.trim().length >= 20 ? { text: pdfText.trim() } : {}),
      };
      const r = await testsApi.generateTestQuestions(body);
      const next: QDraft[] = r.questions.map((q) => ({
        type: q.type,
        prompt: q.prompt,
        options:
          q.type === "multiple_choice" ? normalizeMcqOptions(q.options) : [],
        correctIndex: q.correctIndex,
        correctBoolean: q.correctBoolean,
        points: q.points,
      }));
      setQuestions(next.length ? next : [emptyMcq()]);
      setSource(r.suggestedSource);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xəta");
    } finally {
      setBusy(null);
    }
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();

    const basicsValidationMessage = validateBasics();
    if (basicsValidationMessage) {
      setError(basicsValidationMessage);
      setStep(1);
      return;
    }

    const questionsValidationMessage = validateQuestions();
    if (questionsValidationMessage) {
      setError(questionsValidationMessage);
      setStep(3);
      return;
    }

    setSaving(true);
    setError(null);

    const tl = timeLimit.trim() ? Number(timeLimit) : undefined;
    const body: TestCreateInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      articleId: articleId.trim() || undefined,
      source,
      timeLimitMinutes: tl && !Number.isNaN(tl) ? tl : undefined,
      questions: questions.map((q) => {
        if (q.type === "multiple_choice") {
          return {
            type: q.type,
            prompt: q.prompt.trim(),
            options: q.options.map((o) => o.trim()).filter(Boolean),
            correctIndex: q.correctIndex ?? 0,
            points: q.points,
          };
        }
        if (q.type === "true_false") {
          return {
            type: q.type,
            prompt: q.prompt.trim(),
            correctBoolean: q.correctBoolean ?? true,
            points: q.points,
          };
        }
        return {
          type: "short_answer",
          prompt: q.prompt.trim(),
          points: q.points,
        };
      }),
    };

    try {
      if (isEditMode && editingTestId) {
        await testsApi.updateTest(editingTestId, body);
      } else {
        await testsApi.createTest(body);
      }
      notify(isEditMode ? "Test yeniləndi." : "Test yaradıldı.");
      navigate("/app/tests", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Xəta";
      setError(message);
      notify(message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-toolbar" style={{ marginBottom: "1rem" }}>
        <button type="button" onClick={handleBack} className="btn btn--outline">
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

      <Card title={isEditMode ? "Testi redaktə et" : "Yeni test"}>
        <form onSubmit={onSave}>
          <section
            className="composer-steps"
            aria-label="Test yaratma mərhələləri"
            style={
              {
                "--composer-step-count": creationSteps.length,
                "--composer-step-progress":
                  creationSteps.length > 1
                    ? (step - 1) / (creationSteps.length - 1)
                    : 0,
              } as CSSProperties
            }
          >
            {creationSteps.map((item) => {
              const isCurrent = item.id === step;
              const isDone = item.id < step;
              const isReachable = allowFreeStepNav || item.id <= step;
              const className = [
                "composer-step",
                isCurrent ? "composer-step--current" : "",
                isDone ? "composer-step--done" : "",
                isReachable ? "composer-step--clickable" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <button
                  key={item.id}
                  type="button"
                  className={className}
                  onClick={() => goToStep(item.id)}
                  disabled={(!isReachable && !allowFreeStepNav) || !!busy || saving}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`${item.title}. ${item.hint}`}
                >
                  <span className="composer-step__marker" aria-hidden>
                    <span className="composer-step__marker-core" />
                  </span>
                  <span className="composer-step__title">{item.title}</span>
                </button>
              );
            })}
          </section>

          {step === 1 ? (
            <section className="composer-stage">
              <div className="composer-stage__intro">
                <h3 className="composer-h">Əsas məlumatlar</h3>
                <p className="composer-hint">
                  Əvvəl testin əsas parametrlərini qur. Sonrakı addımda sualları
                  əl ilə, PDF, JSON və ya AI ilə hazırlaya bilərsən.
                </p>
              </div>

              <Input
                label="Başlıq"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <label className="field">
                <span className="field__label">Təsvir</span>
                <textarea
                  className="input input--textarea"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>

              <label className="field">
                <span className="field__label">Mənbə növü</span>
                <span className="source-select">
                  <select
                    className="field__input source-select__input select-field-chevron"
                    value={source}
                    onChange={(e) =>
                      onSourceChange(
                        e.target.value as TestCreateInput["source"],
                      )
                    }
                  >
                    <option value="manual">Əl ilə</option>
                    <option value="from_article">Məqalədən</option>
                    <option value="import_json">JSON import</option>
                    <option value="import_pdf">PDF import</option>
                    <option value="ai_openai">AI OpenAI</option>
                    <option value="ai_gemini">AI Gemini</option>
                    <option value="ai_deepseek">AI DeepSeek</option>
                    <option value="ai_other">Digər AI</option>
                  </select>
                </span>
              </label>

              <Input
                label="Vaxt limiti (dəq, istəyə bağlı)"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                type="number"
                min={1}
                max={480}
              />

              {initialArticleId ? (
                <p className="composer-hint">
                  Bu səhifə məqalə üzərindən açılıb. Məqalə ID növbəti addımda
                  hazır olacaq.
                </p>
              ) : null}
            </section>
          ) : null}

          {step === 2 ? (
            <section className="composer-stage">
              <div className="composer-stage__intro">
                <h3 className="composer-h">Mənbə və sual hazırlığı</h3>
                <p className="composer-hint">
                  Test suallarını əl ilə yazmağa keçə və ya burada JSON, PDF və
                  AI vasitəsilə ilkin sualları yarada bilərsən.
                </p>
              </div>

              <div className="composer-summary">
                <div className="composer-summary__item">
                  <span className="composer-summary__label">Başlıq</span>
                  <strong className="composer-summary__value">
                    {title.trim() || "Başlıq yoxdur"}
                  </strong>
                </div>
                <div className="composer-summary__item">
                  <span className="composer-summary__label">Mənbə</span>
                  <strong className="composer-summary__value">
                    {sourceLabels[source]}
                  </strong>
                </div>
                <div className="composer-summary__item">
                  <span className="composer-summary__label">Hazır sual</span>
                  <strong className="composer-summary__value">
                    {questionCount}
                  </strong>
                </div>
              </div>

              <section className="composer-section">
                <h3 className="composer-h">Sürətli import</h3>
                <p className="composer-hint">
                  JSON faylı `version: 1`, `title`, `questions` strukturu ilə
                  olmalıdır.
                </p>
                <label className="file-pill">
                  <span>JSON fayl seç</span>
                  <input
                    type="file"
                    accept="application/json,.json"
                    hidden
                    onChange={onImportJson}
                  />
                </label>
              </section>

              <section className="composer-section">
                <h3 className="composer-h">PDF / DOCX → suallar</h3>
                <p className="composer-hint">
                  Fayldakı suallar avtomatik oxunub aşağıdakı sual bölməsinə
                  doldurulur. Struktur uyğun gəlməzsə mətn AI üçün saxlanılır.
                </p>
                <div className="page-actions">
                  <label className="file-pill">
                    <span>PDF yüklə</span>
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      hidden
                      onChange={onPdf}
                    />
                  </label>
                  <label className="file-pill">
                    <span>DOCX yüklə</span>
                    <input
                      type="file"
                      accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      hidden
                      onChange={onDocx}
                    />
                  </label>
                </div>
                {pdfText ? (
                  <textarea
                    className="field__input field__input--textarea"
                    style={{ marginTop: "0.75rem" }}
                    rows={6}
                    value={pdfText}
                    onChange={(e) => setPdfText(e.target.value)}
                  />
                ) : null}
              </section>

              <section className="composer-section">
                <h3 className="composer-h">Saytdakı məqalə</h3>
                <label className="composer-check">
                  <input
                    type="checkbox"
                    checked={useSiteArticle}
                    onChange={(e) => onUseSiteArticleToggle(e.target.checked)}
                  />
                  <span className="composer-check__text">
                    Məqaləni istifadə et
                  </span>
                </label>
                {useSiteArticle ? (
                  <>
                    <p className="composer-hint">
                      Vebsayta yüklədiyiniz və ya yaratdığınız məqalələri seçin.
                      Seçilmiş məqalə AI ilə sual yaradarkən və ya testdə mənbə
                      kimi istifadə olunur.
                    </p>
                    {articlesError ? (
                      <p className="field__error">{articlesError}</p>
                    ) : null}
                    <label className="field">
                      <span className="field__label">Məqalə seç</span>
                      <select
                        className="field__input select-field-chevron"
                        value={articleSelectValue}
                        disabled={articlesLoading}
                        onChange={(e) => {
                          const next = e.target.value;
                          setArticleId(next);
                          if (next) setSource("from_article");
                        }}
                      >
                        <option value="">
                          {articlesLoading
                            ? "Məqalələr yüklənir…"
                            : "— Məqalə seçin —"}
                        </option>
                        {articleSelectOptions.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.title} · {articleStatusLabel(a.status)}
                          </option>
                        ))}
                      </select>
                    </label>
                    {!articlesLoading &&
                    myArticles.length === 0 &&
                    !articleId.trim() ? (
                      <p className="composer-hint">
                        Hələ məqaləniz yoxdur.{" "}
                        <Link to="/app/articles/new">Yeni məqalə</Link> və ya{" "}
                        <Link to="/app/articles">dərc siyahısından</Link> əlavə
                        edin.
                      </p>
                    ) : null}
                    <Input
                      label="Məqalə ID (siyahıda yoxdursa)"
                      value={articleIdInPickerList ? "" : articleId}
                      onChange={(e) => {
                        const next = e.target.value;
                        setArticleId(next);
                        if (next.trim()) setSource("from_article");
                      }}
                      placeholder="Məsələn, başqa məqalənin ObjectId-si"
                    />
                  </>
                ) : null}
              </section>

              <section className="composer-section">
                <h3 className="composer-h">AI ilə sual yarat</h3>
                <label className="field">
                  <span className="field__label">Provayder</span>
                  <select
                    className="field__input select-field-chevron"
                    value={aiProvider}
                    onChange={(e) =>
                      onAiProviderChange(
                        e.target.value as "openai" | "gemini" | "deepseek",
                      )
                    }
                  >
                    <option value="deepseek">DeepSeek</option>
                    <option value="openai">OpenAI</option>
                    <option value="gemini">Google Gemini</option>
                  </select>
                </label>
                <Input
                  label="Sual sayı"
                  type="number"
                  min={1}
                  max={30}
                  value={String(aiCount)}
                  onChange={(e) => setAiCount(Number(e.target.value) || 1)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!!busy}
                  onClick={onAiFromPdfOrArticle}
                >
                  AI ilə suallar gətir
                </Button>
              </section>
            </section>
          ) : null}

          {step === 3 ? (
            <section className="composer-stage">
              <div className="composer-stage__intro">
                <h3 className="composer-h">Sualları tamamla</h3>
                <p className="composer-hint">
                  İndi sualları əl ilə redaktə et, lazım olsa yenisini əlavə et
                  və sonda testi {isEditMode ? "yenilə" : "yarat"}.
                </p>
              </div>

              <div className="composer-summary">
                <div className="composer-summary__item">
                  <span className="composer-summary__label">Başlıq</span>
                  <strong className="composer-summary__value">
                    {title.trim() || "Başlıq yoxdur"}
                  </strong>
                </div>
                <div className="composer-summary__item">
                  <span className="composer-summary__label">Mənbə</span>
                  <strong className="composer-summary__value">
                    {sourceLabels[source]}
                  </strong>
                </div>
                <div className="composer-summary__item">
                  <span className="composer-summary__label">Sual sayı</span>
                  <strong className="composer-summary__value">
                    {questionCount}
                  </strong>
                </div>
                <div className="composer-summary__item">
                  <span className="composer-summary__label">Ümumi xal</span>
                  <strong className="composer-summary__value">
                    {totalPoints}
                  </strong>
                </div>
              </div>

              <div className="page-actions" style={{ margin: "0 0 1rem" }}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setQuestions((q) => [...q, emptyMcq()])}
                >
                  + Çoxseçimli
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setQuestions((q) => [...q, emptyTf()])}
                >
                  + Doğru/Yanlış
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setQuestions((q) => [...q, emptyShort()])}
                >
                  + Qısa cavab
                </Button>
              </div>

              {questions.length === 0 ? (
                <div className="question-editor">
                  <p className="composer-hint" style={{ marginBottom: 0 }}>
                    Hələ sual yoxdur. Yuxarıdakı düymələrlə əl ilə sual əlavə et
                    və ya əvvəlki addımda AI/PDF mənbələrindən istifadə et.
                  </p>
                </div>
              ) : null}

              {questions.map((q, i) => (
                <div key={i} className="question-editor">
                  <div className="question-editor__header">
                    <span className="composer-h">Sual {i + 1}</span>
                    <button
                      type="button"
                      className="question-editor__delete-btn"
                      onClick={() =>
                        setQuestions((qs) => qs.filter((_, j) => j !== i))
                      }
                      aria-label="Sualı sil"
                      title="Sualı sil"
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                      </svg>
                    </button>
                  </div>

                  <label className="field">
                    <span className="field__label">Növ</span>
                    <select
                      className="field__input select-field-chevron"
                      value={q.type}
                      onChange={(e) => {
                        const nextType = e.target.value as QuestionType;
                        if (nextType === "multiple_choice")
                          setQuestion(i, emptyMcq());
                        else if (nextType === "true_false")
                          setQuestion(i, emptyTf());
                        else setQuestion(i, emptyShort());
                      }}
                    >
                      <option value="multiple_choice">Çoxseçimli</option>
                      <option value="true_false">Doğru/Yanlış</option>
                      <option value="short_answer">Qısa cavab</option>
                    </select>
                  </label>

                  <Input
                    label="Sual mətni"
                    value={q.prompt}
                    onChange={(e) => setQuestion(i, { prompt: e.target.value })}
                  />

                  <Input
                    label="Xal"
                    type="number"
                    min={1}
                    value={String(q.points)}
                    onChange={(e) =>
                      setQuestion(i, { points: Number(e.target.value) || 1 })
                    }
                  />

                  {q.type === "multiple_choice" ? (
                    <>
                      {q.options.map((opt, j) => (
                        <Input
                          key={j}
                          label={`Variant ${j + 1}`}
                          value={opt}
                          onChange={(e) => {
                            const next = [...q.options];
                            next[j] = e.target.value;
                            setQuestion(i, { options: next });
                          }}
                        />
                      ))}
                      <label className="field">
                        <span className="field__label">
                          Düzgün indeks (0–
                          {Math.max(
                            q.options
                              .map((option) => option.trim())
                              .filter(Boolean).length - 1,
                            0,
                          )}
                          )
                        </span>
                        <input
                          className="field__input"
                          type="number"
                          min={0}
                          max={Math.max(q.options.length - 1, 0)}
                          value={q.correctIndex ?? 0}
                          onChange={(e) =>
                            setQuestion(i, {
                              correctIndex: Number(e.target.value),
                            })
                          }
                        />
                      </label>
                    </>
                  ) : null}

                  {q.type === "true_false" ? (
                    <label className="field">
                      <span className="field__label">Düzgün cavab</span>
                      <select
                        className="field__input select-field-chevron"
                        value={q.correctBoolean ? "true" : "false"}
                        onChange={(e) =>
                          setQuestion(i, {
                            correctBoolean: e.target.value === "true",
                          })
                        }
                      >
                        <option value="true">Doğru</option>
                        <option value="false">Yanlış</option>
                      </select>
                    </label>
                  ) : null}
                </div>
              ))}
            </section>
          ) : null}

          {error ? <p className="field__error">{error}</p> : null}
          {busy ? <p className="composer-hint">{busy}</p> : null}

          <div className="composer-nav">
            <div className="page-actions">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setError(null);
                    setStep((current) =>
                      current > 1 ? ((current - 1) as CreationStep) : current,
                    );
                  }}
                  disabled={!!busy || saving}
                >
                  Geri
                </Button>
              ) : null}
            </div>

            <div className="page-actions">
              {step < 3 ? (
                <Button
                  type="button"
                  onClick={onNextStep}
                  disabled={!!busy || saving}
                >
                  {step === 1 ? "Mənbə seçiminə keç" : "Suallara keç"}
                </Button>
              ) : (
                <Button type="submit" loading={saving} disabled={!!busy}>
                  {isEditMode ? "Dəyişiklikləri saxla" : "Testi yarat"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
