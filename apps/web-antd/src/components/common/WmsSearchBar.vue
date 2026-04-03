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
              <!-- text / textarea -->
              <a-input
                v-if="field.type === 'input'"
                v-model:value="formState[field.key]"
                :placeholder="field.placeholder || `请输�?{field.label}`"
                @press-enter="handleSearch"
              />
              <!-- select -->
              <a-select
                v-else-if="field.type === 'select'"
                v-model:value="formState[field.key]"
                :placeholder="field.placeholder || `请选择${field.label}`"
                :options="field.options"
                allow-clear
                style="width: 100%"
              />
              <!-- switch -->
              <a-switch
                v-else-if="field.type === 'switch'"
                :checked="getFieldValue(field.key)"
                :checked-children="field.options?.[0]?.label || '启用'"
                :un-checked-children="field.options?.[1]?.label || '停用'"
                @update:checked="(val: boolean) => setFieldValue(field.key, val)"
              />
              <!-- treeSelect -->
              <a-tree-select
                v-else-if="field.type === 'treeSelect'"
                v-model:value="formState[field.key]"
                :placeholder="field.placeholder || `请选择${field.label}`"
                :tree-data="getTreeSelectData(field.key)"
                :loading="treeSelectLoading[field.key]"
                :tree-checkable="field.treeMultiple"
                :multiple="field.treeMultiple"
                allow-clear
                tree-default-expand-all
                show-search
                style="width: 100%"
                @dropdown-visible-change="(open: boolean) => open && loadTreeSelectOptions(field)"
              />
              <!-- dateRange -->
              <a-range-picker
                v-else-if="field.type === 'dateRange'"
                v-model:value="formState[field.key]"
                :placeholder="getDateRangePlaceholder(field)"
                :format="field.dateFormat || 'YYYY-MM-DD'"
                :show-time="field.showTime"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
              <!-- numberRange：两个数字输入框并排 -->
              <div v-else-if="field.type === 'numberRange'" class="number-range">
                <a-input-number
                  v-model:value="formState[`${field.key}Min`]"
                  :placeholder="field.placeholder?.split('~')[0]?.trim() || '最小�?"
                  :min="0"
                  class="number-range__input"
                />
                <span class="number-range__sep">~</span>
                <a-input-number
                  v-model:value="formState[`${field.key}Max`]"
                  :placeholder="field.placeholder?.split('~')[1]?.trim() || '最大�?"
                  :min="0"
                  class="number-range__input"
                />
              </div>
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
  InputNumber as AInputNumber,
  Menu as AMenu,
  MenuItem as AMenuItem,
  RangePicker as ARangePicker,
  Row as ARow,
  Select as ASelect,
  Space as ASpace,
  Switch as ASwitch,
  TreeSelect as ATreeSelect,
} from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';

export interface SearchField {
  key: string;
  label: string;
  type: 'input' | 'select' | 'switch' | 'treeSelect' | 'dateRange' | 'numberRange';
  options?: { label: string; value: string | number }[];
  /** treeSelect 专用：本地树形数�?*/
  treeData?: TreeNode[];
  /** treeSelect 专用：懒加载接口 URL */
  treeUrl?: string;
  /** treeSelect 专用：树节点字段映射，默�?{ label:'title', value:'value', children:'children' } */
  treeFieldNames?: { label: string; value: string; children: string };
  /** treeSelect 专用：是否多选，默认 false */
  treeMultiple?: boolean;
  /** dateRange 专用：日期格式，默认 'YYYY-MM-DD' */
  dateFormat?: string;
  /** dateRange 专用：是否显示时间，默认 false */
  showTime?: boolean;
  /** placeholder 占位提示 */
  placeholder?: string;
}

interface TreeNode {
  title: string;
  value: string | number;
  children?: TreeNode[];
  [key: string]: any;
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

// treeSelect 数据缓存（key �?树节点数组）
const treeSelectData = reactive<Record<string, TreeNode[]>(\{\});
// treeSelect 加载状�?const treeSelectLoading = reactive<Record<string, boolean>>({});
// treeSelect 懒加�?Promise 防止并发重复请求
const treeSelectInflight = new Map<string, Promise<void>>();

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

// 使用本地 reactive 状�?const formState = reactive<Record<string, any>>({});

// 同步 props.modelValue 到本地状态（初始化蛇形和驼峰两个版本�?watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      Object.assign(formState, newVal);
      for (const [snake, camel] of Object.entries(snakeToCamel)) {
        if (formState[snake] !== undefined) formState[camel] = formState[snake];
        else if (formState[camel] !== undefined) formState[snake] = formState[camel];
      }
    }
  },
  { immediate: true, deep: true }
);

function getFieldValue(key: string) {
  if (formState[key] !== undefined) return formState[key];
  const camelKey = snakeToCamel[key];
  if (camelKey !== undefined) return formState[camelKey];
  return undefined;
}

function setFieldValue(key: string, value: any) {
  formState[key] = value;
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
    if (cached) selectedKeys.value = JSON.parse(cached);
  } catch {
    // ignore
  }
}

function saveCache() {
  if (!props.cacheKey) return;
  localStorage.setItem(props.cacheKey, JSON.stringify(selectedKeys.value));
}

function initSelectedKeys() {
  if (props.cacheKey) loadCache();
  if (selectedKeys.value.length === 0 && allFields.value.length > 0) {
    selectedKeys.value = allFields.value.map((f) => f.key);
    saveCache();
  }
}

function getTreeSelectData(key: string): TreeNode[] {
  return treeSelectData[key] ?? [];
}

async function loadTreeSelectOptions(field: SearchField) {
  if (field.type !== 'treeSelect') return;
  if (treeSelectData[field.key]?.length) return;
  if (Array.isArray(field.treeData) && field.treeData.length) {
    treeSelectData[field.key] = field.treeData;
    return;
  }
  if (!field.treeUrl) return;

  if (treeSelectInflight.has(field.treeUrl)) {
    await treeSelectInflight.get(field.treeUrl);
    return;
  }

  const load = (async () => {
    treeSelectLoading[field.key] = true;
    try {
      const res = await fetch(field.treeUrl);
      if (!res.ok) throw new Error('fetch failed');
      const json = await res.json();
      const rows = json?.data ?? json?.rows ?? json ?? [];
      const fieldNames = field.treeFieldNames ?? { label: 'title', value: 'value', children: 'children' };
      if (Array.isArray(rows)) {
        treeSelectData[field.key] = normalizeTreeNodes(rows, fieldNames);
      }
    } catch {
      treeSelectData[field.key] = [];
    } finally {
      treeSelectLoading[field.key] = false;
      treeSelectInflight.delete(field.treeUrl!);
    }
  })();

  treeSelectInflight.set(field.treeUrl, load);
  await load;
}

function normalizeTreeNodes(
  nodes: any[],
  fieldNames: { label: string; value: string; children: string },
): TreeNode[] {
  return nodes.map((n) => {
    const labelKey = fieldNames.label;
    const valueKey = fieldNames.value;
    const childrenKey = fieldNames.children;
    const rawChildren = n[childrenKey];
    const children =
      Array.isArray(rawChildren) && rawChildren.length
        ? normalizeTreeNodes(rawChildren, fieldNames)
        : undefined;
    return {
      title: n[labelKey] ?? n.label ?? n.name ?? String(n[valueKey] ?? ''),
      value: n[valueKey] ?? n.value ?? '',
      children,
    };
  });
}

/** dateRange placeholder 计算 */
function getDateRangePlaceholder(field: SearchField): [string, string] {
  if (field.placeholder) {
    const parts = field.placeholder.split('~');
    return [
      parts[0]?.trim() || `${field.label}开始`,
      parts[1]?.trim() || `${field.label}结束`,
    ];
  }
  return [`${field.label}开始`, `${field.label}结束`];
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
            label: o.label || String(o.value),
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
    } else if (formType === 'treeSelect') {
      const fieldNames = col.treeFieldNames || col.tree_field_names;
      result.push({
        key,
        label,
        type: 'treeSelect',
        treeData: col.treeData || [],
        treeUrl: col.treeUrl || null,
        treeFieldNames:
          typeof fieldNames === 'string' ? JSON.parse(fieldNames) : fieldNames,
        treeMultiple: !!(col.treeMultiple || col.tree_multiple),
      });
    } else if (formType === 'dateRange') {
      result.push({
        key,
        label,
        type: 'dateRange',
        dateFormat: col.dateFormat || col.date_format || 'YYYY-MM-DD',
        showTime: !!(col.showTime || col.show_time),
      });
    } else if (formType === 'numberRange') {
      result.push({
        key,
        label,
        type: 'numberRange',
        placeholder: col.placeholder || '最小�?~ 最大�?,
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
    allFields.value = parseMetaFields(rawFields);
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
    empty[`${f.key}Min`] = undefined;
    empty[`${f.key}Max`] = undefined;
    formState[f.key] = undefined;
    formState[`${f.key}Min`] = undefined;
    formState[`${f.key}Max`] = undefined;
  });
  emit('update:modelValue', empty);
  emit('reset');
}

watch(
  () => props.remoteFieldsUrl,
  () => loadRemoteFields(),
);

onMounted(() => loadRemoteFields());

/** 暴露方法：动态更新下拉选项 */
function updateFieldOptions(
  key: string,
  options: { label: string; value: string | number }[],
) {
  const field = allFields.value.find((f) => f.key === key);
  if (field) field.options = options;
}

/** 暴露方法：动态注�?treeSelect 数据 */
function updateFieldTreeData(key: string, treeData: TreeNode[]) {
  const field = allFields.value.find((f) => f.key === key);
  if (field && field.type === 'treeSelect') {
    treeSelectData[key] = treeData;
  }
}

defineExpose({ updateFieldOptions, updateFieldTreeData });
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
.number-range {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
}
.number-range__input {
  flex: 1;
  width: 0;
}
.number-range__sep {
  color: #999;
  flex-shrink: 0;
}
</style>
