import type { ITest } from "@akademik/shared";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as testsApi from "@/api/tests";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { TestImportMenuButton } from "./TestImportMenuButton";
import { TestVisualCard } from "./TestVisualCard";

const TESTS_BACK_STATE = { testBackTo: "/app/tests" as const };

export function TestsPage() {
  const [tests, setTests] = useState<ITest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await testsApi.fetchTests();
        if (!cancelled) setTests(rows);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Testlər yüklənmədi");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
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
          <h1 className="page-title">Testlər</h1>
        </div>
      </div>

      <div className="page-toolbar articles-toolbar__links tests-toolbar">
        <Button
          type="button"
          variant={editMode ? "primary" : "secondary"}
          className={`tests-toolbar__button articles-toolbar__link-btn${editMode ? " tests-toolbar__button--active" : ""}`}
          onClick={() => setEditMode((current) => !current)}
          aria-pressed={editMode}
        >
          {editMode ? "Redaktəni bağla" : "Redaktə et"}
        </Button>

        <Link
          to="/app/tests/new"
          state={TESTS_BACK_STATE}
          className="tests-toolbar__link"
        >
          <Button className="tests-toolbar__button articles-toolbar__link-btn">+ Yeni test</Button>
        </Link>

        <TestImportMenuButton
          backTo={TESTS_BACK_STATE.testBackTo}
          className="tests-toolbar__link articles-toolbar__upload"
        />
      </div>

      {editMode ? (
        <p className="tests-edit-hint">
          Redaktə etmək üçün testi kartdan seç.
        </p>
      ) : null}

      {error ? <p className="field__error">{error}</p> : null}

      <div className={`article-grid${tests.length ? " article-grid--books" : ""}`}>
        {tests.length === 0 ? (
          <section className="card animate-slide-up">
            <div className="card__head">
              <h2 className="card__title">Test tapılmadı</h2>
            </div>
            <div className="card__body">
              Hələ test yoxdur. `+ Yeni test`, `.json`, `.pdf` və ya `.docx`
              ilə əlavə edə bilərsən.
            </div>
          </section>
        ) : (
          tests.map((test) => (
            <Link
              key={test.id}
              to={editMode ? `/app/tests/${test.id}/edit` : `/app/tests/${test.id}`}
              state={TESTS_BACK_STATE}
              className="article-card-link"
            >
              <TestVisualCard test={test} editable={editMode} />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
