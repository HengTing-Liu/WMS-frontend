<template>
  <div class="wms-stats-cards" :style="gridStyle">
    <Card
      v-for="item in normalizedItems"
      :key="item.key"
      :bordered="false"
      class="wms-stats-cards__item"
    >
      <div class="wms-stats-cards__content">
        <div class="wms-stats-cards__icon" :class="`wms-stats-cards__icon--${item.tone}`">
          <component :is="item.icon" v-if="item.icon" />
        </div>
        <div class="wms-stats-cards__info">
          <p class="wms-stats-cards__label">{{ item.label }}</p>
          <p class="wms-stats-cards__value">{{ item.value }}</p>
        </div>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Card } from 'ant-design-vue';
import type { WmsStatItem } from './types';

const props = defineProps<{
  items?: WmsStatItem[];
  /** @deprecated 兼容旧调用，优先使用 items */
  stats?: WmsStatItem[];
}>();

const normalizedItems = computed(() => (props.items?.length ? props.items : props.stats ?? []).slice(0, 4));

const gridStyle = computed(() => {
  const columns = Math.min(Math.max(normalizedItems.value.length || 1, 1), 4);
  return {
    '--wms-stats-columns': String(columns),
  };
});
</script>

<style scoped>
.wms-stats-cards {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(var(--wms-stats-columns), minmax(0, 1fr));
}

.wms-stats-cards__item :deep(.ant-card-body) {
  padding: 16px;
}

.wms-stats-cards__content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.wms-stats-cards__icon {
  display: flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  flex-shrink: 0;
}

.wms-stats-cards__icon:empty {
  display: none;
}

.wms-stats-cards__icon :deep(svg) {
  width: 20px;
  height: 20px;
}

.wms-stats-cards__icon--blue {
  background-color: #eff6ff;
  color: #2563eb;
}

.wms-stats-cards__icon--green {
  background-color: #f0fdf4;
  color: #16a34a;
}

.wms-stats-cards__icon--orange {
  background-color: #fff7ed;
  color: #ea580c;
}

.wms-stats-cards__icon--purple {
  background-color: #faf5ff;
  color: #9333ea;
}

.wms-stats-cards__icon--red {
  background-color: #fef2f2;
  color: #dc2626;
}

.wms-stats-cards__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.wms-stats-cards__label {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.4;
}

.wms-stats-cards__value {
  margin: 0;
  color: #1f2937;
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
  word-break: break-all;
}

@media (max-width: 1024px) {
  .wms-stats-cards {
    grid-template-columns: repeat(min(var(--wms-stats-columns), 2), minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .wms-stats-cards {
    grid-template-columns: 1fr;
  }
}
</style>
