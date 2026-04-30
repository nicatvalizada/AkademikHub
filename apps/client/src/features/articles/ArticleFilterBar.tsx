import type { ArticleStatus } from "@akademik/shared";
import type { ChangeEvent } from "react";
import type { ArticleFilterState, ArticleSortKey } from "./articleFilters";

type Props = {
  value: ArticleFilterState;
  onChange: (next: ArticleFilterState) => void;
  tagOptions: string[];
  statusOptions?: Array<{ value: ArticleStatus | ""; label: string }>;
  showSearch?: boolean;
};

const SORT_OPTIONS: Array<{ value: ArticleSortKey; label: string }> = [
  { value: "updated_desc", label: "Ən yeni" },
  { value: "updated_asc", label: "Ən köhnə" },
  { value: "title_asc", label: "A-dan Z-yə" },
  { value: "title_desc", label: "Z-dən A-ya" },
];

function IconSearch() {
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
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function ArticleFilterBar({
  value,
  onChange,
  tagOptions,
  statusOptions,
  showSearch = true,
}: Props) {
  function update<K extends keyof ArticleFilterState>(key: K, nextValue: ArticleFilterState[K]) {
    onChange({ ...value, [key]: nextValue });
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    update("query", event.target.value);
  }

  function onTagChange(event: ChangeEvent<HTMLSelectElement>) {
    update("tag", event.target.value);
  }

  function onStatusChange(event: ChangeEvent<HTMLSelectElement>) {
    update("status", event.target.value as ArticleStatus | "");
  }

  function onSortChange(event: ChangeEvent<HTMLSelectElement>) {
    update("sort", event.target.value as ArticleSortKey);
  }

  return (
    <section className="article-filters" role="search" aria-label="Məqalə filtrləri">
      <div className={`article-filters__main${showSearch ? "" : " article-filters__main--compact"}`}>
        {showSearch ? (
          <label className="articles-toolbar__search article-filters__search" aria-label="Məqalə axtarışı">
            <span className="articles-toolbar__search-icon" aria-hidden>
              <IconSearch />
            </span>
            <input
              className="articles-toolbar__search-input"
              value={value.query}
              onChange={onInputChange}
              placeholder="Başlıq, məzmun və ya teq üzrə"
            />
          </label>
        ) : null}

        <div className="articles-toolbar__panel article-filters__panel">
          <label className="field articles-toolbar__panel-field article-filters__field">
            <span className="field__label">Teq</span>
            <select className="field__input" value={value.tag} onChange={onTagChange}>
              <option value="">Bütün teqlər</option>
              {tagOptions.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </label>
          {statusOptions ? (
            <label className="field articles-toolbar__panel-field article-filters__field">
              <span className="field__label">Status</span>
              <select className="field__input" value={value.status} onChange={onStatusChange}>
                {statusOptions.map((option) => (
                  <option key={option.value || "all"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="field articles-toolbar__panel-field article-filters__field">
            <span className="field__label">Sıralama</span>
            <select className="field__input" value={value.sort} onChange={onSortChange}>
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </section>
  );
}
