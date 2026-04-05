<template>
  <Page auto-content-height>
    <div class="wms-page-layout">
      <div class="wms-page-layout__header">
        <div class="wms-page-layout__header-left">
          <h1 class="wms-page-layout__title">{{ title }}</h1>
          <p v-if="description" class="wms-page-layout__desc">{{ description }}</p>
        </div>

        <div v-if="hasActions" class="wms-page-layout__header-right">
          <slot v-if="$slots.actions" name="actions" />
          <template v-else>
            <Button
              v-for="action in actions"
              :key="action.label"
              :type="action.type ?? 'default'"
              @click="action.onClick"
            >
              <template v-if="action.icon" #icon>
                <component :is="action.icon" />
              </template>
              {{ action.label }}
            </Button>
          </template>
        </div>
      </div>

      <div v-if="$slots.stats" class="wms-page-layout__section">
        <slot name="stats" />
      </div>

      <div v-if="$slots.filter || $slots.filters" class="wms-page-layout__section">
        <slot v-if="$slots.filter" name="filter" />
        <slot v-else name="filters" />
      </div>

      <div v-if="$slots.table || $slots.default" class="wms-page-layout__section">
        <slot v-if="$slots.table" name="table" />
        <slot v-else />
      </div>
    </div>
  </Page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Button } from 'ant-design-vue';
import { Page } from '@vben/common-ui';
import type { Component } from 'vue';

interface WmsPageAction {
  label: string;
  type?: 'primary' | 'default';
  icon?: Component;
  onClick: () => void;
}

const props = defineProps<{
  title: string;
  description?: string;
  actions?: WmsPageAction[];
}>();

const slots = defineSlots<{
  actions?: () => any;
  stats?: () => any;
  filter?: () => any;
  filters?: () => any;
  table?: () => any;
  default?: () => any;
}>();

const hasActions = computed(() => !!props.actions?.length || !!slots.actions);
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
  padding: 0 0 16px;
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

.wms-page-layout__header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.wms-page-layout__header-right :deep(.ant-btn) {
  display: inline-flex;
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
