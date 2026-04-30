import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as articlesApi from "@/api/articles";
import * as testsApi from "@/api/tests";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";

function DashboardActionArrow() {
  return (
    <span className="dashboard-action-btn__icon" aria-hidden>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 17L17 7" />
        <path d="M9 7h8v8" />
      </svg>
    </span>
  );
}

export function DashboardHome() {
  const { user } = useAuth();
  const [testsCount, setTestsCount] = useState<number | null>(null);
  const [articlesCount, setArticlesCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [tests, articles] = await Promise.all([
          testsApi.fetchTests(),
          articlesApi.fetchPublishedArticles(),
        ]);
        if (!cancelled) {
          setTestsCount(tests.length);
          setArticlesCount(articles.length);
        }
      } catch {
        if (!cancelled) {
          setTestsCount(null);
          setArticlesCount(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const firstName = user?.name?.split(/\s+/)[0] ?? "qonaq";

  return (
    <div className="animate-fade-in dashboard-home">
      <div className="dashboard-home__greet">
        <h2 className="dashboard-home__hello">Salam, {firstName}!</h2>
        <p className="dashboard-home__hint">
          Platformada mövcud test və məqalə sayı API-dən gəlir; şəxsi nəticələr üçün backend
          genişləndirilə bilər.
        </p>
      </div>

      {loading ? (
        <div className="page-center">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="dashboard-stats">
            <Card title="Mövcud testlər" subtitle="Platformada aktiv testlər">
              <p className="dashboard-stats__value">{testsCount ?? "—"}</p>
              <div className="dashboard-stats__foot">
                <Link to="/app/tests" className="dashboard-action-btn">
                  Testlərə keç <DashboardActionArrow />
                </Link>
              </div>
            </Card>
            <Card title="Dərc olunmuş məqalələr" subtitle="Oxunabilən məqalə sayı">
              <p className="dashboard-stats__value">{articlesCount ?? "—"}</p>
              <div className="dashboard-stats__foot">
                <Link to="/app/articles" className="dashboard-action-btn">
                  Məqalələrə keç <DashboardActionArrow />
                </Link>
              </div>
            </Card>
            <Card title="Orta bal" subtitle="Şəxsi statistika (tezliklə)">
              <p className="dashboard-stats__value">—</p>
              <div className="dashboard-stats__foot" style={{ color: "var(--text-secondary)", fontSize: "0.85rem", padding: "0.5rem 0" }}>
                Test nəticələri saxlanandan sonra
              </div>
            </Card>
            <Card title="Komponentlər" subtitle="Məqalə xülasələri">
              <p className="dashboard-stats__value">{articlesCount ?? "—"}</p>
              <div className="dashboard-stats__foot">
                <Link to="/app/components" className="dashboard-action-btn">
                  Baxış <DashboardActionArrow />
                </Link>
              </div>
            </Card>
          </div>

          <div className="dashboard-panels">
            <Card title="Son fəaliyyət" subtitle="Sessiya üzrə qeyd">
              <div className="dashboard-empty">
                <span className="dashboard-empty__icon" aria-hidden>
                  <svg viewBox="0 0 32 32" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <path d="M6 6h9a4 4 0 014 4v18a2 2 0 00-2-2H6V6zM26 6h-9a4 4 0 00-4 4v18a2 2 0 012-2h11V6z" />
                  </svg>
                </span>
                <p className="dashboard-empty__title">Hələ fəaliyyət yoxdur</p>
                <p className="dashboard-empty__text">
                  Məqalə oxuyun və ya test həll edin — fəaliyyət burada görünəcək.
                </p>
              </div>
            </Card>
            <Card title="Tövsiyə olunan" subtitle="Növbəti addımlar">
              <ul className="dashboard-tips">
                <li>
                  <span className="dashboard-tips__dot" aria-hidden />
                  Seçdiyiniz komponentləri sonraya saxlayın —{" "}
                  <Link to="/app/components">Komponentlər</Link> səhifəsindən izləyin.
                </li>
                <li>
                  <span className="dashboard-tips__dot" aria-hidden />
                  <Link to="/app/tests/new">Yeni test</Link> yaradaraq özünüzü və yoldaşlarınızı
                  yoxlayın.
                </li>
                <li>
                  <span className="dashboard-tips__dot" aria-hidden />
                  <Link to="/app/leaderboard">Lider lövhəsi</Link> tezliklə aktiv olacaq.
                </li>
              </ul>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
