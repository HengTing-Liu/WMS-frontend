<template>
  <div class="wms-search-bar">
    <div class="search-bar-body">
      <!-- 字段区域（自动换行，按钮始终靠右不换行） -->
      <div class="search-fields">
        <a-form-item
          v-for="field in displayedFields"
          :key="field.key"
          :label="field.label"
          class="search-field-item"
        >
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
      </div>

      <!-- 操作按钮（固定靠右，不参与 flex-wrap） -->
      <div class="search-actions">
        <a-button type="primary" @click="handleSearch">
          <IconifyIcon icon="material-symbols:search" /> 搜索
        </a-button>
        <a-button @click="handleReset">
          <IconifyIcon icon="material-symbols:refresh" /> 重置
        </a-button>
        <a-dropdown v-model:open="fieldsDropdownOpen" :trigger="['click']">
          <a-button>
            <IconifyIcon icon="material-symbols:tune" /> 字段
          </a-button>
          <template #overlay>
            <a-menu>
              <a-menu-item
                v-for="field in allFields"
                :key="field.key"
                @click.stop
              >
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  Button as AButton,
  Checkbox as ACheckbox,
  Dropdown as ADropdown,
  FormItem as AFormItem,
  Input as AInput,
  Menu as AMenu,
  MenuItem as AMenuItem,
  Select as ASelect,
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
const fieldsDropdownOpen = ref(false);

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
      // 调试：isEnabled 字段的访问
      if (key === 'isEnabled' || key === 'is_enabled') {
        console.log('[DEBUG Proxy get]', key, 'val:', val, 'field:', field ? `${field.type}` : 'null', '→ 返回:', field?.type === 'switch' ? (val === undefined || val === null ? 'true(启用)' : (val ? 'true' : 'false')) : val);
      }
      if (field?.type === 'switch') {
        // switch 未选择时保持空值，不默认启用
        if (val === undefined || val === null) return undefined;
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
    // 跳过不可搜索的字段
    if (!col.isSearchable) continue;

    const key = col.code;
    const label = col.label || key;
    const formType = col.formType || 'input';

    // 逻辑删除字段不应出现在默认搜索栏
    if (key === 'isDeleted' || key === 'is_deleted') {
      continue;
    }

    // is_enabled / isEnabled 字段特殊处理：强制渲染为 switch（忽略后端的 formType）
    if (key === 'is_enabled' || key === 'isEnabled') {
      result.push({
        key,
        label,
        type: 'switch',
        options: [
          { label: '启用', value: 1 },
          { label: '停用', value: 0 },
        ],
      });
      continue;
    }

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
        // is_enabled / isEnabled 字段特殊处理：强制渲染为 switch
        if (key === 'is_enabled' || key === 'isEnabled') {
          fields.push({
            key,
            label,
            type: 'switch',
            options: [
              { label: '启用', value: 1 },
              { label: '停用', value: 0 },
            ],
          });
          continue;
        }
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
    initSelectedKeys();
  } catch {
    allFields.value = props.fields;
    console.error('[DEBUG WmsSearchBar] 加载失败，使用 props.fields');
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
  // 兼容后端返回 true/false（boolean）和 1/0（number/字符串）两种格式
  const rawEnabled = model.is_enabled ?? model.isEnabled;
  if (rawEnabled !== undefined && rawEnabled !== null) {
    // 转为整数 1（启用）或 0（停用）
    model.is_enabled = isEnabledValue(rawEnabled) ? 1 : 0;
    model.isEnabled = model.is_enabled;
  }
  emit('search', model);
}

/**
 * 统一布尔值判断：兼容 1/0 和 true/false
 * 1/true/'1'/'true' → true（启用），0/false/'0'/'false'/undefined/null → false（停用）
 */
function isEnabledValue(raw: any): boolean {
  if (raw === 1 || raw === true || raw === '1' || raw === 'true') return true;
  if (raw === 0 || raw === false || raw === '0' || raw === 'false') return false;
  return false;
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
  // 点击下拉外部区域时自动关闭
  document.addEventListener('click', handleOutsideClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick);
});

/** 点击下拉外部时关闭字段弹框 */
function handleOutsideClick(e: MouseEvent) {
  const bar = document.querySelector('.wms-search-bar');
  if (bar && !bar.contains(e.target as Node)) {
    fieldsDropdownOpen.value = false;
  }
}

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
  padding: 12px 16px;
  background: #fff;
  border-radius: 4px;
}

.search-bar-body {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.search-fields {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  flex: 1;
  gap: 8px 16px;
}

.search-field-item {
  display: flex;
  align-items: center;
  margin-bottom: 0;
  min-width: 180px;
}

.search-field-item :deep(.ant-form-item-label) {
  padding: 0 8px 0 0;
  flex: 0 0 auto;
}

.search-field-item :deep(.ant-form-item-control) {
  flex: 1;
  min-width: 120px;
}

.search-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
</style>
