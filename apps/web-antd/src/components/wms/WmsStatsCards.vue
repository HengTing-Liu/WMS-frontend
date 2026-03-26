<template>
  <div class="wms-stats-cards" :style="gridStyle">
    <Card
      v-for="item in normalizedStats"
      :key="item.key"
      :bordered="false"
      class="wms-stats-cards__item"
    >
      <div class="wms-stats-cards__content">
        <div class="wms-stats-cards__icon" :style="getIconStyle(item.color)">
          <component :is="item.icon" />
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
import type { StatConfig } from './types';

const props = withDefaults(
  defineProps<{
    stats: StatConfig[];
    columns?: number;
  }>(),
  { columns: 4 }
);

const normalizedStats = computed(() =>
  props.stats.map((item) => ({
    ...item,
    value: typeof item.value === 'function' ? item.value() : item.value,
  }))
);

const gridStyle = computed(() => ({
  '--wms-stats-columns': String(props.columns),
}));

function getIconStyle(color: string) {
  return {
    color,
    backgroundColor: `${color}14`,
  };
}
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
}

.wms-stats-cards__icon :deep(svg) {
  width: 20px;
  height: 20px;
}

.wms-stats-cards__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
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
}

@media (max-width: 1024px) {
  .wms-stats-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .wms-stats-cards {
    grid-template-columns: 1fr;
  }
}
</style>
