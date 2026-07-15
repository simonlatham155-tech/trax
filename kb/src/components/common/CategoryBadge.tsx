import type { Category } from '@/types';
import { CATEGORY_COLORS, CATEGORY_DOT } from '@/types';

interface Props {
  category: Category;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export function CategoryBadge({ category, size = 'sm', dot }: Props) {
  const cls = CATEGORY_COLORS[category];
  const dotCls = CATEGORY_DOT[category];
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${cls} ${pad}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotCls}`} />}
      {category}
    </span>
  );
}
