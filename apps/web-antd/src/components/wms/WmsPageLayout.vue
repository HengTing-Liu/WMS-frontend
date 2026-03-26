<template>
  <Page auto-content-height>
    <div class="wms-page-layout">
      <div class="wms-page-layout__header">
        <div class="wms-page-layout__header-left">
          <h1 class="wms-page-layout__title">{{ title }}</h1>
          <p v-if="description" class="wms-page-layout__desc">{{ description }}</p>
        </div>
        <div v-if="$slots.actions" class="wms-page-layout__header-right">
          <slot name="actions" />
        </div>
      </div>

      <div v-if="$slots.stats" class="wms-page-layout__section">
        <slot name="stats" />
      </div>

      <div v-if="$slots.filters" class="wms-page-layout__section">
        <slot name="filters" />
      </div>

      <div class="wms-page-layout__section">
        <slot />
      </div>
    </div>
  </Page>
</template>

<script setup lang="ts">
import { Page } from '@vben/common-ui';

defineProps<{
  title: string;
  description?: string;
}>();
</script>

<style scoped>
.wms-page-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.wms-page-layout__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.wms-page-layout__header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.wms-page-layout__title {
  margin: 0;
  color: #1f2937;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.4;
}

.wms-page-layout__desc {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.wms-page-layout__header-right :deep(.ant-btn-primary) {
  display: flex;
  align-items: center;
  gap: 6px;
}

@media (max-width: 768px) {
  .wms-page-layout__header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
