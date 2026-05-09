import type { SortableOptions } from 'sortablejs';
import type Sortable from 'sortablejs';

function useSortable<T extends HTMLElement>(
  sortableContainer: T,
  options: SortableOptions = {},
) {
  const initializeSortable = async () => {
    // sortablejs 1.x: 默认导出即 Sortable 类
    const { default: SortableModule } = await import('sortablejs');
    if (!SortableModule) {
      console.warn('[useSortable] sortablejs 未安装，请执行: pnpm add sortablejs -w');
      return null;
    }
    const sortable = SortableModule.create(sortableContainer, {
      animation: 300,
      delay: 0,
      delayOnTouchOnly: false,
      ...options,
    });
    return sortable as Sortable;
  };

  return {
    initializeSortable,
  };
}

export { useSortable };

export type { Sortable };
