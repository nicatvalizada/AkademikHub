import type { ITest, ITestResult } from "@akademik/shared";
import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import * as testsApi from "@/api/tests";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useNotificationStore } from "@/store/notificationStore";

function formatRemaining(seconds: number): string {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(
    2,
    "0",
  )}`;
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`test-session-panel__toggle-icon${open ? " test-session-panel__toggle-icon--open" : ""}`}
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function TestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const notify = useNotificationStore((state) => state.notify);
  const [test, setTest] = useState<ITest | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [questionListOpen, setQuestionListOpen] = useState(true);
  const [result, setResult] = useState<ITestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const startedAtRef = useRef(Date.now());
  const autoSubmittedRef = useRef(false);

  const backTo =
    location.state &&
    typeof location.state === "object" &&
    "testBackTo" in location.state &&
    typeof location.state.testBackTo === "string"
      ? location.state.testBackTo
      : "/app/tests";

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    testsApi
      .fetchTest(id)
      .then((value) => {
        if (cancelled) return;
        setTest(value);
        setRemainingSeconds(
          value.timeLimitMinutes ? value.timeLimitMinutes * 60 : null,
        );
        startedAtRef.current = Date.now();
        setActiveIndex(0);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Test yüklənmədi");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const submitCurrentTest = async (reason: "manual" | "timer" = "manual") => {
    if (!id || !test || submitting || result) return;

    setSubmitting(true);
    setError(null);

    try {
      const durationSeconds = Math.max(
        1,
        Math.round((Date.now() - startedAtRef.current) / 1000),
      );
      const submitted = await testsApi.submitTest(id, answers, durationSeconds);
      setResult(submitted);
      notify(
        reason === "timer" ? "Vaxt bitdi, test təqdim olundu." : "Test təqdim olundu.",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Test təqdim olunmadı";
      setError(message);
      notify(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!test?.timeLimitMinutes || result) return;

    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current === null) return current;
        if (current <= 1) {
          window.clearInterval(timer);
          if (!autoSubmittedRef.current) {
            autoSubmittedRef.current = true;
            void submitCurrentTest("timer");
          }
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [result, test?.timeLimitMinutes]);

  if (!id) {
    return <Navigate to="/app/tests" replace />;
  }

  if (loading) {
    return (
      <div className="page-center">
        <Spinner />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="animate-fade-in">
        <p className="field__error">{error ?? "Test tapılmadı."}</p>
      </div>
    );
  }

  const activeQuestion = test.questions[activeIndex];
  const activeAnswer = activeQuestion ? answers[activeQuestion.id] : undefined;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const totalSeconds = (test.timeLimitMinutes ?? 0) * 60;
  const progress =
    totalSeconds > 0 && remainingSeconds !== null
      ? Math.max(0, Math.min(1, remainingSeconds / totalSeconds))
      : 1;
  const timerClassName = [
    "test-session-panel",
    "test-session-panel--timer",
    remainingSeconds !== null && remainingSeconds <= 10
      ? "test-session-panel--timer-danger"
      : remainingSeconds !== null && remainingSeconds <= 60
        ? "test-session-panel--timer-warning"
        : "",
    remainingSeconds !== null &&
    remainingSeconds > 0 &&
    remainingSeconds <= 10 &&
    !result
      ? "test-session-panel--timer-pulse"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  function setCurrentAnswer(value: unknown) {
    if (!activeQuestion) return;
    setAnswers((current) => ({ ...current, [activeQuestion.id]: value }));
  }

  return (
    <div className="test-detail-page animate-fade-in">
      <div className="test-detail-page__toolbar">
        <button
          type="button"
          onClick={() => navigate(backTo)}
          className="btn btn--outline"
        >
          Geri
        </button>
      </div>

      {error ? <p className="field__error">{error}</p> : null}
      {result ? (
        <div className="result-banner">
          Nəticə: {result.score} / {result.maxScore}
        </div>
      ) : null}

      <div className="test-session-layout">
        <section className="test-session">
          <header className="test-session__head">
            <h1 className="test-session__title">{activeQuestion?.prompt}</h1>
          </header>

          <form
            className="test-session__form"
            onSubmit={(event) => {
              event.preventDefault();
              void submitCurrentTest("manual");
            }}
          >
            {activeQuestion?.type === "multiple_choice" ? (
              <div className="test-answer-list">
                {(activeQuestion.options ?? []).map((option, optionIndex) => {
                  const selected = activeAnswer === optionIndex;
                  return (
                    <button
                      key={`${activeQuestion.id}-${optionIndex}`}
                      type="button"
                      className={[
                        "test-answer-card",
                        selected ? "test-answer-card--selected" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => setCurrentAnswer(optionIndex)}
                      disabled={!!result}
                    >
                      <span className="test-answer-card__key">
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                      <span className="test-answer-card__label">{option}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {activeQuestion?.type === "true_false" ? (
              <div className="test-answer-list">
                {[
                  { label: "Doğru", value: true },
                  { label: "Yanlış", value: false },
                ].map((option, optionIndex) => {
                  const selected = activeAnswer === option.value;
                  return (
                    <button
                      key={`${activeQuestion.id}-${option.label}`}
                      type="button"
                      className={[
                        "test-answer-card",
                        selected ? "test-answer-card--selected" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => setCurrentAnswer(option.value)}
                      disabled={!!result}
                    >
                      <span className="test-answer-card__key">
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                      <span className="test-answer-card__label">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {activeQuestion?.type === "short_answer" ? (
              <label className="test-answer-textarea">
                <span className="test-answer-textarea__label">Cavab</span>
                <textarea
                  className="field__input field__input--textarea test-answer-textarea__input"
                  value={typeof activeAnswer === "string" ? activeAnswer : ""}
                  onChange={(event) => setCurrentAnswer(event.target.value)}
                  disabled={!!result}
                />
              </label>
            ) : null}

            {!result ? (
              <div className="test-session__actions">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={activeIndex === 0}
                  onClick={() => setActiveIndex((current) => Math.max(0, current - 1))}
                >
                  Əvvəlki
                </Button>
                <div className="test-session__actions-right">
                  {activeIndex < test.questions.length - 1 ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        setActiveIndex((current) =>
                          Math.min(test.questions.length - 1, current + 1),
                        )
                      }
                    >
                      Növbəti
                    </Button>
                  ) : null}
                  <Button
                    type="submit"
                    className="test-session__submit"
                    disabled={submitting}
                  >
                    {submitting ? "Göndərilir…" : "Testi bitir"}
                  </Button>
                </div>
              </div>
            ) : null}
          </form>
        </section>

        <aside className="test-session-sidebar">
          {test.timeLimitMinutes ? (
            <section className={timerClassName}>
              <div className="test-session-timer" aria-hidden>
                <svg viewBox="0 0 120 120">
                  <circle className="test-session-timer__track" cx="60" cy="60" r={radius} />
                  <circle
                    className="test-session-timer__fill"
                    cx="60"
                    cy="60"
                    r={radius}
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - progress)}
                  />
                </svg>
                <span className="test-session-timer__value">
                  {formatRemaining(remainingSeconds ?? 0)}
                </span>
              </div>
            </section>
          ) : null}

          <section className="test-session-panel">
            <div className="test-session-panel__head">
              <p className="test-session-panel__title">Sual siyahısı</p>
              <div className="test-session-panel__controls">
                <span className="test-session-panel__count">
                  {Object.values(answers).filter((value) => {
                    if (typeof value === "string") return value.trim().length > 0;
                    return value !== undefined && value !== null;
                  }).length}
                  /{test.questions.length}
                </span>
                <button
                  type="button"
                  className="test-session-panel__toggle"
                  onClick={() => setQuestionListOpen((current) => !current)}
                >
                  <IconChevron open={questionListOpen} />
                </button>
              </div>
            </div>

            {questionListOpen ? (
              <div className="test-session-question-list">
                {test.questions.map((question, index) => {
                  const value = answers[question.id];
                  const answered =
                    typeof value === "string"
                      ? value.trim().length > 0
                      : value !== undefined && value !== null;

                  return (
                    <button
                      key={question.id}
                      type="button"
                      className={[
                        "test-session-question-list__item",
                        index === activeIndex
                          ? "test-session-question-list__item--active"
                          : "",
                        answered
                          ? "test-session-question-list__item--answered"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => setActiveIndex(index)}
                    >
                      <span className="test-session-question-list__text">
                        Sual {index + 1}
                      </span>
                      <span className="test-session-question-list__status">
                        {answered ? "●" : <span className="test-session-question-list__dot" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
