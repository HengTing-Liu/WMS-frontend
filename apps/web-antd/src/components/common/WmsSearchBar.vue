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
                v-model:value="formState[field.key]"
                :placeholder="`请输入${field.label}`"
                @press-enter="handleSearch"
              />
              <a-select
                v-else-if="field.type === 'select'"
                v-model:value="formState[field.key]"
                :placeholder="`请选择${field.label}`"
                :options="field.options"
                allow-clear
                style="width: 100%"
              />
              <a-switch
                v-else-if="field.type === 'switch'"
                :checked="getFieldValue(field.key)"
                :checked-children="field.options?.[0]?.label || '启用'"
                :un-checked-children="field.options?.[1]?.label || '停用'"
                @update:checked="(val: boolean) => setFieldValue(field.key, val)"
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
import { computed, onMounted, reactive, ref, watch } from 'vue';
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

// 驼峰/蛇形映射（searchForm 用驼峰，WmsSearchBar 字段用蛇形）
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

// 使用本地 reactive 状态，替代直接引用 props.modelValue
const formState = reactive<Record<string, any>>({});

// 同步 props.modelValue 到本地状态（初始化蛇形和驼峰两个版本）
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      Object.assign(formState, newVal);
      // 同步蛇形 <-> 驼峰
      for (const [snake, camel] of Object.entries(snakeToCamel)) {
        if (formState[snake] !== undefined) formState[camel] = formState[snake];
        else if (formState[camel] !== undefined) formState[snake] = formState[camel];
      }
    }
  },
  { immediate: true, deep: true }
);

function getFieldValue(key: string) {
  // 优先用蛇形键，再用驼峰键
  if (formState[key] !== undefined) return formState[key];
  const camelKey = snakeToCamel[key];
  if (camelKey !== undefined) return formState[camelKey];
  return undefined;
}

function setFieldValue(key: string, value: any) {
  formState[key] = value;
  // 同时维护驼峰键（供 loadData 回退逻辑使用）
  const camelKey = snakeToCamel[key];
  if (camelKey) formState[camelKey] = value;
  emit('update:modelValue', { ...formState });
}

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
}

/**
 * 从 meta API 响应中解析搜索栏字段
 * 后端 ColumnMetaVO 格式：{ code, label, formType, isSearchable, dictType, options }
 * options 由后端根据 dictType 自动加载 sys_dict_data，无需额外请求
 */
function parseMetaFields(metaData: any[]): SearchField[] {
  const result: SearchField[] = [];

  for (const col of metaData) {
    // 只处理 isSearchable: true 的字段
    if (!col.isSearchable) continue;

    const key = col.code;
    const label = col.label || key;
    const formType = col.formType || 'input';

    if (formType === 'input' || formType === 'textarea' || formType === 'text') {
      result.push({ key, label, type: 'input' });
    } else if (formType === 'select' || formType === 'radio' || formType === 'checkbox') {
      // 有 options（后端已根据 dictType 加载）：直接使用
      if (Array.isArray(col.options) && col.options.length > 0) {
        result.push({
          key,
          label,
          type: 'select',
          options: col.options.map((o: any) => ({
            label: o.label || String(o.value),
            value: o.value,
          })),
        });
      }
      // 有 dataSource：使用
      else if (Array.isArray(col.dataSource) && col.dataSource.length > 0) {
        result.push({
          key,
          label,
          type: 'select',
          options: col.dataSource.map((o: any) => ({
            label: o.label || o.text || o.name || String(o.value),
            value: o.value,
          })),
        });
      }
      // 无数据源：空 options（后续由父组件通过 ref 注入）
      else {
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

    // 解析 meta 字段（只取 isSearchable: true）
    // 后端已自动根据 dict_type 加载 options，无需额外请求
    const fields = parseMetaFields(rawFields);

    allFields.value = fields;
  } catch {
    allFields.value = props.fields;
  }
  initSelectedKeys();
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
  emit('search', { ...formState });
}

function handleReset() {
  const empty: Record<string, any> = {};
  allFields.value.forEach((f) => {
    empty[f.key] = undefined;
    formState[f.key] = undefined;
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

// 暴露方法供父组件调用，更新指定字段的 options（如公司下拉数据）
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
