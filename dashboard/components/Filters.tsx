"use client";

export type FilterState = {
  q: string;
  platform: string;
  sort: string;
  order: string;
};

export default function Filters({
  filters,
  onChange,
}: {
  filters: FilterState;
  onChange: (f: FilterState) => void;
}) {
  return (
    <div className="hq-card mb-4 flex flex-wrap items-center gap-2 border-slate-200 bg-slate-50/60 p-2.5 dark:border-slate-700 dark:bg-slate-900/60">
      <input
        className="field w-full md:w-72"
        placeholder="Search content or author..."
        value={filters.q}
        onChange={(e) => onChange({ ...filters, q: e.target.value })}
      />

      <select
        className="select-field"
        value={filters.platform}
        onChange={(e) => onChange({ ...filters, platform: e.target.value })}
      >
        <option value="all">All Platforms</option>
        <option value="facebook">Facebook</option>
        <option value="instagram">Instagram</option>
        <option value="article">Articles</option>
        <option value="website">Websites</option>
      </select>
      <select
        className="select-field"
        value={filters.sort}
        onChange={(e) => onChange({ ...filters, sort: e.target.value })}
      >
        <option value="post_date">Sort by Date</option>
        <option value="likes">Sort by Likes</option>
        <option value="comments">Sort by Comments</option>
        <option value="shares">Sort by Shares</option>
      </select>

      <select
        className="select-field"
        value={filters.order}
        onChange={(e) => onChange({ ...filters, order: e.target.value })}
      >
        <option value="desc">Descending</option>
        <option value="asc">Ascending</option>
      </select>
    </div>
  );
}
