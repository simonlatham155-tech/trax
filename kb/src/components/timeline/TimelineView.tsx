import { useKBStore } from '@/store/kb-store';
import { CATEGORY_DOT } from '@/types';
import type { Article } from '@/types';

export function TimelineView() {
  const articles = useKBStore((s) => s.articles);
  const openArticle = useKBStore((s) => s.openArticle);

  // Only articles with a year
  const dated = articles
    .filter((a) => a.year != null)
    .sort((a, b) => a.year! - b.year!);

  if (dated.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#3a3a5c] text-sm">
        No articles have years set yet.
      </div>
    );
  }

  const minYear = Math.min(...dated.map((a) => a.year!));
  const maxYear = Math.max(...dated.map((a) => a.yearEnd ?? a.year!));

  // Group articles by year bucket
  const yearRange: number[] = [];
  for (let y = minYear; y <= maxYear; y++) yearRange.push(y);

  // Map year → articles that start or are active in that year
  const byYear = new Map<number, Article[]>();
  for (const a of dated) {
    const y = a.year!;
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y)!.push(a);
  }

  // Major era markers
  const eras = [
    { year: 1990, label: 'Progressive House Emerges', color: 'bg-amber-500' },
    { year: 1993, label: 'Scene Fragments', color: 'bg-violet-500' },
    { year: 1996, label: 'Trance Splits Off', color: 'bg-teal-500' },
    { year: 1999, label: 'Superclub Peak', color: 'bg-rose-500' },
    { year: 2001, label: 'Genre Explosion', color: 'bg-sky-500' },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8">
      <h2 className="text-lg font-bold text-[#e8e8f8] mb-1">Timeline</h2>
      <p className="text-xs text-[#6666a0] mb-8">
        {minYear} — {maxYear} · {dated.length} articles with dates
      </p>

      <div className="relative">
        {/* Vertical spine */}
        <div className="absolute left-[72px] top-0 bottom-0 w-px bg-[#1e1e32]" />

        {yearRange.map((year) => {
          const items = byYear.get(year) ?? [];
          const era = eras.find((e) => e.year === year);

          return (
            <div key={year} className="relative flex gap-0 mb-2">
              {/* Year label */}
              <div className="w-[72px] shrink-0 flex items-start justify-end pr-4 pt-0.5">
                <span className="text-[11px] font-mono text-[#3a3a5c] select-none">{year}</span>
              </div>

              {/* Node + content */}
              <div className="flex-1 pl-5 pb-2">
                {/* Era marker */}
                {era && (
                  <div className="flex items-center gap-2 mb-2 -ml-5">
                    <span className={`w-3 h-3 rounded-full shrink-0 ${era.color} ring-2 ring-[#0c0c14]`} />
                    <span className="text-xs font-semibold text-[#c8c8e8]">{era.label}</span>
                  </div>
                )}

                {/* Articles */}
                {items.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => openArticle(a.id)}
                    className="group flex items-start gap-3 mb-2 text-left w-full"
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 mt-1 ${CATEGORY_DOT[a.category]} ring-2 ring-[#0c0c14] group-hover:scale-125 transition-transform`}
                    />
                    <div>
                      <span className="text-sm text-[#c8c8e8] group-hover:text-violet-300 transition-colors font-medium leading-snug">
                        {a.title}
                      </span>
                      {a.subtitle && (
                        <span className="text-xs text-[#3a3a5c] ml-2">{a.subtitle}</span>
                      )}
                      {a.yearEnd != null && a.yearEnd !== a.year && (
                        <span className="text-[10px] font-mono text-[#3a3a5c] ml-2">
                          → {a.yearEnd}
                        </span>
                      )}
                    </div>
                  </button>
                ))}

                {items.length === 0 && !era && (
                  <div className="h-2" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
