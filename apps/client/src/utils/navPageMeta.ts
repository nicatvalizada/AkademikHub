export function getNavPageMeta(pathname: string): { title: string; subtitle?: string } {
  const p = pathname.replace(/\/$/, "") || "/app/dashboard";

  if (p === "/app/dashboard") {
    return {
      title: "İdarə paneli",
      subtitle: "Statistikalar real vaxtda yenilənir (mövcud API ilə).",
    };
  }
  if (p === "/app/articles/mine") {
    return { title: "Mənim məqalələrim", subtitle: "Layihə və qeydlər" };
  }
  if (p === "/app/articles/new") {
    return { title: "Yeni məqalə", subtitle: "Məzmun və dərc statusu" };
  }
  if (/\/app\/articles\/[^/]+\/edit$/.test(p)) {
    return { title: "Məqaləni redaktə et", subtitle: "Dəyişiklikləri saxlayın" };
  }
  if (/\/app\/articles\/[^/]+$/.test(p) && !p.endsWith("/articles/new") && !p.endsWith("/mine")) {
    return { title: "Məqalə", subtitle: "Oxu və paylaş" };
  }
  if (p === "/app/articles") {
    return {
      title: "Məqalələr",
      subtitle: "Elektrotexnika sahəsində elmi və texniki məqalələr",
    };
  }
  if (p === "/app/tests/new") {
    return { title: "Yeni test", subtitle: "Əl ilə, import və ya AI" };
  }
  if (/\/app\/tests\/[^/]+\/edit$/.test(p)) {
    return { title: "Testi redaktə et", subtitle: "Sual və parametrləri yenilə" };
  }
  if (/\/app\/tests\/[^/]+$/.test(p) && !p.endsWith("/tests/new")) {
    return { title: "Test", subtitle: "Cavablarınızı təqdim edin" };
  }
  if (p === "/app/tests") {
    return {
      title: "Testlər",
      subtitle: "Biliyinizi yoxlayın — vaxt məhdudiyyətli testlər",
    };
  }
  if (p === "/app/electro") {
    return { title: "Elektro modulu", subtitle: "Komponent kitabxanası" };
  }
  if (p === "/app/components") {
    return { title: "Komponentlər", subtitle: "Məqalələrin əsas məqamları — sürətli icmal" };
  }
  if (p === "/app/leaderboard") {
    return { title: "Lider lövhəsi", subtitle: "Reytinq və nailiyyətlər" };
  }

  return { title: "Akademik Hub", subtitle: "Modul əsaslı öyrənmə platforması" };
}
