import type { ITest, QuestionType } from "@akademik/shared";
import type { CSSProperties } from "react";

type Props = {
  test: ITest;
  editable?: boolean;
};

const typeLabels: Record<QuestionType, string> = {
  multiple_choice: "Çoxseçimli",
  true_false: "Doğru/Yanlış",
  short_answer: "Qısa cavab",
};

function getAccentPalette(questionCount: number) {
  if (questionCount <= 5) return { color: "#16a34a", soft: "#dcfce7" };
  if (questionCount <= 10) return { color: "#2563eb", soft: "#dbeafe" };
  if (questionCount <= 15) return { color: "#d97706", soft: "#fef3c7" };
  if (questionCount <= 20) return { color: "#7c3aed", soft: "#ede9fe" };
  return { color: "#dc2626", soft: "#fee2e2" };
}

function formatDuration(durationSeconds?: number): string {
  if (!durationSeconds || durationSeconds < 1) return "--:--";
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getQuestionTypeTags(test: ITest): string[] {
  return Array.from(new Set(test.questions.map((question) => question.type))).map(
    (type) => typeLabels[type],
  );
}

function IconPencil() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function TestVisualCard({ test, editable = false }: Props) {
  const palette = getAccentPalette(test.questions.length);
  const percent = Math.max(0, Math.min(100, Math.round(test.viewerProgress?.percent ?? 0)));
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - percent / 100);
  const createdAt = new Date(test.createdAt);
  const tags = getQuestionTypeTags(test);

  return (
    <article
      className={`test-sheet-card${editable ? " test-sheet-card--editable" : ""}`}
      style={
        {
          "--test-accent-color": palette.color,
          "--test-accent-soft": palette.soft,
        } as CSSProperties
      }
    >
      <div className="test-sheet-card__visual">
        {editable ? (
          <div className="test-sheet-card__edit-overlay" aria-hidden>
            <span className="test-sheet-card__edit-badge">
              <IconPencil />
            </span>
          </div>
        ) : null}
        <div className="test-sheet-card__back-sheet" aria-hidden />
        <div className="test-sheet-card__paper">
          <span className="test-sheet-card__clip" aria-hidden />
          <h3 className="test-sheet-card__title">{test.title}</h3>

          <div className="test-sheet-card__rows" aria-hidden>
            <span className="test-sheet-card__row test-sheet-card__row--correct" />
            <span className="test-sheet-card__row" />
            <span className="test-sheet-card__row" />
            <span className="test-sheet-card__row" />
          </div>

          <div className="test-sheet-card__footer">
            <div className="test-sheet-card__stats">
              <span>{test.questions.length} sual</span>
              <span>{test.timeLimitMinutes ? `${test.timeLimitMinutes} dəq` : "Limitsiz"}</span>
            </div>
            <div className="test-sheet-card__tags">
              {tags.map((tag) => (
                <span key={tag} className="test-sheet-card__tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="test-sheet-card__meta">
        <p className="test-sheet-card__subtitle">
          Son yenilənmə: {new Date(test.updatedAt).toLocaleDateString()}
        </p>
        <p className="test-sheet-card__excerpt">
          {test.description?.trim() || "Test təsviri əlavə olunmayıb."}
        </p>
        <div className="test-sheet-card__progress-panel test-sheet-card__progress-panel--meta">
          <div className="test-sheet-card__progress" aria-hidden>
            <svg viewBox="0 0 60 60">
              <circle
                className="test-sheet-card__progress-track"
                cx="30"
                cy="30"
                r={radius}
              />
              <circle
                className="test-sheet-card__progress-fill"
                cx="30"
                cy="30"
                r={radius}
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
              />
            </svg>
            <span className="test-sheet-card__progress-value">{percent}%</span>
          </div>

          <div className="test-sheet-card__progress-meta">
            <div className="test-sheet-card__progress-stat">
              <span className="test-sheet-card__progress-label">Müddət</span>
              <strong>{formatDuration(test.viewerProgress?.durationSeconds)}</strong>
            </div>
            <div className="test-sheet-card__progress-stat">
              <span className="test-sheet-card__progress-label">Tarix</span>
              <strong>{createdAt.toLocaleDateString()}</strong>
            </div>
            <div className="test-sheet-card__progress-stat">
              <span className="test-sheet-card__progress-label">Saat</span>
              <strong>
                {createdAt.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
