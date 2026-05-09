<template>
  <Card :bordered="false" class="wms-filter-bar">
    <div class="wms-filter-bar__inner">
      <slot name="prepend" />

      <div v-if="searchKey" class="wms-filter-bar__search-wrap">
        <Search class="wms-filter-bar__search-icon" />
        <Input
          v-model:value="query[searchKey]"
          allow-clear
          :placeholder="searchPlaceholder"
          class="wms-filter-bar__search-input"
          @press-enter="emit('search')"
        />
      </div>

      <slot name="search-after" />

      <Select
        v-if="statusKey && statusOptions?.length"
        v-model:value="query[statusKey]"
        allow-clear
        :placeholder="$t('page.wms.filter.allStatus')"
        class="wms-filter-bar__status"
        :options="statusOptions"
        @change="emit('search')"
      />

      <div v-if="activeFields.length > 0" class="wms-filter-bar__tags">
        <div v-for="field in activeFields" :key="field.key" class="wms-filter-bar__tag">
          <span class="wms-filter-bar__tag-label">{{ field.label }}:</span>
          <Select
            v-if="field.type === 'select'"
            v-model:value="query[field.key]"
            allow-clear
            :placeholder="`${$t('page.common.selectPlaceholder')}${field.label}`"
            class="wms-filter-bar__tag-select"
            :options="field.options"
            @change="emit('search')"
          />
          <Input
            v-else
            v-model:value="query[field.key]"
            allow-clear
            :placeholder="`${$t('page.common.inputPlaceholder')}${field.label}`"
            class="wms-filter-bar__tag-input"
            @press-enter="emit('search')"
          />
          <X class="wms-filter-bar__tag-close" @click="removeField(field.key)" />
        </div>
      </div>

      <Dropdown v-if="availableFields.length > 0" trigger="click">
        <Button>
          <template #icon><Plus /></template>
          {{ $t('page.wms.filter.addFilter') }}
          <ChevronDown />
        </Button>
        <template #overlay>
          <Menu>
            <MenuItem v-for="item in availableFields" :key="item.key" @click="addField(item.key)">
              {{ item.label }}
            </MenuItem>
          </Menu>
        </template>
      </Dropdown>

      <slot name="actions" />
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Button, Card, Dropdown, Input, Menu, MenuItem, Select } from 'ant-design-vue';
import { ChevronDown, Plus, Search, X } from 'lucide-vue-next';
import { $t } from '@vben/locales';
import type { WmsFilterFieldDef } from './types';

const props = withDefaults(
  defineProps<{
    query: Record<string, any>;
    searchKey?: string;
    searchPlaceholder?: string;
    statusKey?: string;
    statusOptions?: Array<{ label: string; value: any }>;
    fields?: WmsFilterFieldDef[];
    storageKey?: string;
    defaultFieldKeys?: string[];
  }>(),
  {
    searchKey: undefined,
    searchPlaceholder: '请输入关键字',
    statusKey: undefined,
    statusOptions: () => [],
    fields: () => [],
    storageKey: undefined,
    defaultFieldKeys: () => [],
  }
);

const emit = defineEmits<{
  search: [];
}>();

const activeFieldKeys = ref<string[]>([]);

const activeFields = computed(() =>
  activeFieldKeys.value
    .map((key) => props.fields.find((item) => item.key === key))
    .filter((item): item is WmsFilterFieldDef => Boolean(item))
);

const availableFields = computed(() =>
  props.fields.filter((item) => !activeFieldKeys.value.includes(item.key))
);

function loadFieldKeys() {
  const defaultKeys = props.defaultFieldKeys.length
    ? props.defaultFieldKeys
    : props.fields.slice(0, 2).map((item) => item.key);

  if (!props.storageKey) {
    activeFieldKeys.value = [...defaultKeys];
    return;
  }

  try {
    const saved = localStorage.getItem(props.storageKey);
    activeFieldKeys.value = saved ? JSON.parse(saved) : [...defaultKeys];
  } catch {
    activeFieldKeys.value = [...defaultKeys];
  }
}

function saveFieldKeys() {
  if (!props.storageKey) return;
  localStorage.setItem(props.storageKey, JSON.stringify(activeFieldKeys.value));
}

function addField(key: string) {
  if (activeFieldKeys.value.includes(key)) return;
  activeFieldKeys.value.push(key);
  saveFieldKeys();
}

function removeField(key: string) {
  activeFieldKeys.value = activeFieldKeys.value.filter((item) => item !== key);
  props.query[key] = undefined;
  saveFieldKeys();
  emit('search');
}

watch(
  () => props.fields,
  () => {
    activeFieldKeys.value = activeFieldKeys.value.filter((key) =>
      props.fields.some((item) => item.key === key)
    );

    if (activeFieldKeys.value.length === 0 && props.fields.length > 0) {
      loadFieldKeys();
    }
  },
  { deep: true }
);

onMounted(() => {
  loadFieldKeys();
});
</script>

<style scoped>
.wms-filter-bar :deep(.ant-card-body) {
  padding: 16px;
}

.wms-filter-bar__inner {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.wms-filter-bar__search-wrap {
  position: relative;
  flex: 1;
  min-width: 280px;
}

.wms-filter-bar__search-icon {
  position: absolute;
  top: 50%;
  left: 12px;
  z-index: 1;
  width: 16px;
  height: 16px;
  color: #9ca3af;
  transform: translateY(-50%);
}

.wms-filter-bar__search-input {
  padding-left: 36px !important;
}

.wms-filter-bar__status {
  width: 140px;
}

.wms-filter-bar__tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.wms-filter-bar__tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f3f4f6;
  font-size: 13px;
}

.wms-filter-bar__tag-label {
  color: #374151;
  font-weight: 500;
  white-space: nowrap;
}

.wms-filter-bar__tag-input,
.wms-filter-bar__tag-select {
  width: 120px;
  height: 26px;
}

.wms-filter-bar__tag-select :deep(.ant-select-selector) {
  height: 26px !important;
  padding: 0 8px !important;
}

.wms-filter-bar__tag-select :deep(.ant-select-selection-search-input) {
  height: 24px !important;
}

.wms-filter-bar__tag-close {
  width: 14px;
  height: 14px;
  color: #9ca3af;
  cursor: pointer;
  transition: color 0.2s;
}

.wms-filter-bar__tag-close:hover {
  color: #ef4444;
}
</style>
