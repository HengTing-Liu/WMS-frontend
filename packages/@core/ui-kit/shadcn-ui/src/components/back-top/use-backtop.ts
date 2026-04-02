import type { BacktopProps } from './backtop';

import { onMounted, onUnmounted, ref, shallowRef } from 'vue';

import { useThrottleFn } from '@vueuse/core';

export const useBackTop = (props: BacktopProps) => {
  const el = shallowRef<HTMLElement>();
  const visible = ref(false);
  let scrollTarget: Document | HTMLElement | undefined;
  let onScroll: (() => void) | undefined;

  const handleScroll = () => {
    if (el.value) {
      visible.value = el.value.scrollTop >= (props?.visibilityHeight ?? 0);
    }
  };

  const handleClick = () => {
    el.value?.scrollTo({ behavior: 'smooth', top: 0 });
  };

  const handleScrollThrottled = useThrottleFn(handleScroll, 300, true);

  onMounted(() => {
    el.value = document.documentElement;

    scrollTarget = document;

    if (props.target) {
      el.value = document.querySelector<HTMLElement>(props.target) ?? undefined;

      if (!el.value) {
        throw new Error(`target does not exist: ${props.target}`);
      }
      // 当传入 target 时，滚动监听改为目标元素
      scrollTarget = el.value;
    }
    // Give visible an initial value, fix #13066
    handleScroll();

    // 避免 @vueuse/core 在 container 为 undefined 时触发 clearDeps 报错
    onScroll = () => handleScrollThrottled();
    scrollTarget?.addEventListener?.('scroll', onScroll, { passive: true });
  });

  onUnmounted(() => {
    if (!scrollTarget || !onScroll) return;
    scrollTarget.removeEventListener?.('scroll', onScroll as any);
  });

  return {
    handleClick,
    visible,
  };
};
