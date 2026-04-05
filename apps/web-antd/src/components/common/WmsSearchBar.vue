<template>
  <div class="wms-search-bar">
    <a-row :gutter="16" align="middle">
      <a-col :span="20">
        <a-row :gutter="16">
          <a-col
            v-for="field in displayedFields"
            :key="field.key"
            :xs="24"
            :sm="12"
            :md="8"
            :lg="6"
            class="mb-4"
          >
            <a-form-item :label="field.label" class="mb-0">
              <a-input
                v-if="field.type === 'input'"
                v-model:value="formModel[field.key]"
                :placeholder="`请输入${field.label}`"
                @press-enter="handleSearch"
              />
              <a-select
                v-else-if="field.type === 'select'"
                v-model:value="formModel[field.key]"
                :placeholder="`请选择${field.label}`"
                :options="field.options"
                allow-clear
                style="width: 100%"
              />
              <a-switch
                v-else-if="field.type === 'switch'"
                v-model:checked="formModel[field.key]"
                :checked-children="field.options?.[0]?.label || '启用'"
                :un-checked-children="field.options?.[1]?.label || '停用'"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-col>
      <a-col :span="4" class="text-right">
        <a-space>
          <a-button type="primary" @click="handleSearch">
            <IconifyIcon icon="material-symbols:search" class="mr-1" /> 搜索
          </a-button>
          <a-button @click="handleReset">
            <IconifyIcon icon="material-symbols:refresh" class="mr-1" /> 重置
          </a-button>
          <a-dropdown>
            <a-button>
              <IconifyIcon icon="material-symbols:settings" class="mr-1" /> 字段
            </a-button>
            <template #overlay>
              <a-menu>
                <a-menu-item v-for="field in allFields" :key="field.key">
                  <a-checkbox
                    :checked="selectedKeys.includes(field.key)"
                    @change="() => toggleField(field.key)"
                  >
                    {{ field.label }}
                  </a-checkbox>
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </a-space>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import {
  Button as AButton,
  Checkbox as ACheckbox,
  Col as ACol,
  Dropdown as ADropdown,
  FormItem as AFormItem,
  Input as AInput,
  Menu as AMenu,
  MenuItem as AMenuItem,
  Row as ARow,
  Select as ASelect,
  Space as ASpace,
  Switch as ASwitch,
} from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';

export interface SearchField {
  key: string;
  label: string;
  type: 'input' | 'select' | 'switch';
  options?: { label: string; value: string | number }[];
}

interface Props {
  fields?: SearchField[];
  remoteFieldsUrl?: string;
  cacheKey?: string;
  modelValue?: Record<string, any>;
}

const props = withDefaults(defineProps<Props>(), {
  fields: () => [],
  remoteFieldsUrl: '',
  cacheKey: '',
  modelValue: () => ({}),
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, any>): void;
  (e: 'search', value: Record<string, any>): void;
  (e: 'reset'): void;
}>();

const allFields = ref<SearchField[]>([]);
const selectedKeys = ref<string[]>([]);

const camelToSnake: Record<string, string> = {
  warehouseCode: 'warehouse_code',
  warehouseName: 'warehouse_name',
  isEnabled: 'is_enabled',
};
const snakeToCamel: Record<string, string> = {
  warehouse_code: 'warehouseCode',
  warehouse_name: 'warehouseName',
  is_enabled: 'isEnabled',
};

watch(
  () => props.modelValue,
  (val) => {
    if (!val) return;
    for (const [snake, camel] of Object.entries(snakeToCamel)) {
      if (val[snake] !== undefined && val[camel] === undefined) val[camel] = val[snake];
      else if (val[camel] !== undefined && val[snake] === undefined) val[snake] = val[camel];
    }
  },
  { once: true }
);

const formModel = computed(() => {
  const target = props.modelValue;
  void target;
  return new Proxy(target, {
    get(target, key: string) {
      const val = target[key];
      if (val === undefined) {
        const alt = snakeToCamel[key] || camelToSnake[key];
        if (alt !== undefined) return target[alt];
      }
      const field = allFields.value.find((f) => f.key === key);
      if (field?.type === 'switch') {
        if (val === 1 || val === '1' || val === true) return true;
        if (val === 0 || val === '0' || val === false) return false;
      }
      return val;
    },
    set(target, key: string, value: any) {
      const field = allFields.value.find((f) => f.key === key);
      if (field?.type === 'switch') {
        value = value ? 1 : 0;
      }
      target[key] = value;
      const snake = camelToSnake[key];
      const camel = snakeToCamel[key];
      if (snake !== undefined) target[snake] = value;
      if (camel !== undefined) target[camel] = value;
      emit('update:modelValue', target);
      return true;
    },
  });
});

const displayedFields = computed(() => {
  return allFields.value.filter((f) => selectedKeys.value.includes(f.key));
});

function loadCache() {
  if (!props.cacheKey) return;
  try {
    const cached = localStorage.getItem(props.cacheKey);
    if (cached) {
      selectedKeys.value = JSON.parse(cached);
    }
  } catch {
    // ignore
  }
}

function saveCache() {
  if (!props.cacheKey) return;
  localStorage.setItem(props.cacheKey, JSON.stringify(selectedKeys.value));
}

function initSelectedKeys() {
  if (props.cacheKey) {
    loadCache();
  }
  if (selectedKeys.value.length === 0 && allFields.value.length > 0) {
    selectedKeys.value = allFields.value.map((f) => f.key);
    saveCache();
  }
  // 兜底：若远程未返回任何字段但 props.fields 有内容，直接使用
  if (allFields.value.length === 0 && props.fields.length > 0) {
    allFields.value = props.fields;
    selectedKeys.value = props.fields.map((f) => f.key);
  }
}

function parseMetaFields(metaData: any[]): SearchField[] {
  const result: SearchField[] = [];

  for (const col of metaData) {
    if (!col.isSearchable) continue;

    const key = col.code;
    const label = col.label || key;
    const formType = col.formType || 'input';

    if (formType === 'input' || formType === 'textarea' || formType === 'text') {
      result.push({ key, label, type: 'input' });
    } else if (formType === 'select' || formType === 'radio' || formType === 'checkbox') {
      if (Array.isArray(col.options) && col.options.length > 0) {
        result.push({
          key,
          label,
          type: 'select',
          options: col.options.map((o: any) => ({
            label: o.label || o.text || o.name || String(o.value),
            value: o.value,
          })),
        });
      } else if (Array.isArray(col.dataSource) && col.dataSource.length > 0) {
        result.push({
          key,
          label,
          type: 'select',
          options: col.dataSource.map((o: any) => ({
            label: o.label || o.text || o.name || String(o.value),
            value: o.value,
          })),
        });
      } else if (col.dictType) {
        result.push({ key, label, type: 'select', options: [] });
      } else {
        result.push({ key, label, type: 'select', options: [] });
      }
    } else if (formType === 'switch') {
      result.push({
        key,
        label,
        type: 'switch',
        options: [
          { label: '启用', value: 1 },
          { label: '停用', value: 0 },
        ],
      });
    }
  }

  return result;
}

async function loadDictOptions(dictType: string): Promise<{ label: string; value: number }[]> {
  try {
    const res = await fetch(`/api/system/dict/data/type/${dictType}`);
    if (!res.ok) throw new Error('dict fetch failed');
    const json = await res.json();
    const rows = json.data || json.rows || json || [];
    return rows.map((item: any) => ({
      label: item.label || item.name || item.dictLabel || String(item.value),
      value: item.value,
    }));
  } catch {
    return [];
  }
}

async function loadRemoteFields() {
  if (!props.remoteFieldsUrl) {
    allFields.value = props.fields;
    initSelectedKeys();
    return;
  }
  try {
    const res = await fetch(props.remoteFieldsUrl);
    if (!res.ok) throw new Error('fetch failed');
    const json = await res.json();
    const rawFields = json.data || json.rows || json || [];

    const fields = parseMetaFields(rawFields);
    // 如果 parseMetaFields 没有过滤出任何字段，回退使用所有远程字段
    if (fields.length === 0 && rawFields.length > 0) {
      for (const col of rawFields) {
        const key = col.code || col.columnName || col.name;
        if (!key) continue;
        const label = col.label || col.columnLabel || key;
        const formType = col.formType || 'input';
        if (formType === 'input' || formType === 'textarea' || formType === 'text') {
          fields.push({ key, label, type: 'input' });
        } else if (formType === 'select' || formType === 'radio') {
          const opts = (col.options || col.dataSource || []).map((o: any) => ({
            label: o.label || o.text || o.name || String(o.value),
            value: o.value,
          }));
          fields.push({ key, label, type: 'select', options: opts });
        }
      }
    }

    const loaders = fields
      .filter((f) => f.type === 'select' && (!f.options || f.options.length === 0))
      .map(async (f) => {
        const meta = rawFields.find((r: any) => r.columnName === f.key);
        if (meta?.dictType) {
          f.options = await loadDictOptions(meta.dictType);
        }
      });

    await Promise.all(loaders);

    allFields.value = fields;
  } catch {
    allFields.value = props.fields;
  }
  initSelectedKeys();
  // 最终兜底：以上都没有就用 props.fields
  if (allFields.value.length === 0 && props.fields.length > 0) {
    allFields.value = props.fields;
    selectedKeys.value = props.fields.map((f) => f.key);
    if (props.cacheKey) saveCache();
  }
}

function toggleField(key: string) {
  if (selectedKeys.value.includes(key)) {
    selectedKeys.value = selectedKeys.value.filter((k) => k !== key);
  } else {
    selectedKeys.value = [...selectedKeys.value, key];
  }
  saveCache();
}

function handleSearch() {
  const model = { ...props.modelValue };
  if (model.is_enabled !== undefined) {
    if (model.is_enabled === true) model.is_enabled = 1;
    else if (model.is_enabled === false) model.is_enabled = 0;
    model.isEnabled = model.is_enabled;
  }
  emit('search', model);
}

function handleReset() {
  const empty: Record<string, any> = {};
  allFields.value.forEach((f) => {
    empty[f.key] = undefined;
  });
  emit('update:modelValue', empty);
  emit('reset');
}

watch(
  () => props.remoteFieldsUrl,
  () => {
    loadRemoteFields();
  },
);

onMounted(() => {
  loadRemoteFields();
});

function updateFieldOptions(key: string, options: { label: string; value: string | number }[]) {
  const field = allFields.value.find((f) => f.key === key);
  if (field) {
    field.options = options;
  }
}

defineExpose({ updateFieldOptions });
</script>

<style scoped>
.wms-search-bar {
  padding: 16px;
  background: #fff;
  border-radius: 4px;
}
.mb-4 {
  margin-bottom: 16px;
}
.mb-0 {
  margin-bottom: 0;
}
.text-right {
  text-align: right;
}
</style>
