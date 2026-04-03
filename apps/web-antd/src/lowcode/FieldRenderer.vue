<!--
  FieldRenderer - 字段类型渲染器
  根据 schema 配置渲染对应的表单控件

  MVP 支持字段类型：text / textarea / number / select / switch

  用法示例：
  <FieldRenderer :field="fieldSchema" :value="formModel.fieldName" @update="(val) => formModel.fieldName = val" />
-->
<template>
  <component
    :is="currentComponent"
    v-bind="currentProps"
    :value="normalizedValue"
    :disabled="disabled || loading"
    @update:value="handleUpdate"
    @change="handleChange"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Input, InputNumber, Select, Switch, Spin } from 'ant-design-vue';
import { requestClient } from '#/api/request';

interface Option {
  label: string;
  value: string | number;
}

interface FieldSchema {
  /** 字段编码 */
  field?: string;
  code?: string;
  /** 字段标题 */
  title?: string;
  label?: string;
  /** 字段类型：text / textarea / number / select / switch */
  fieldType?: string;
  dataType?: string;
  formType?: string;
  /** 字典类型编码（用于 select 从 sys_dict 加载选项） */
  dictType?: string;
  /** 静态选项（优先于 dictType） */
  options?: Option[];
  dataSource?: Option[];
  /** 默认值 */
  defaultValue?: any;
  /** 是否禁用 */
  disabled?: boolean;
  /** placeholder */
  placeholder?: string;
  /** 列宽占比（1-24） */
  colSpan?: number;
}

interface Props {
  /** 字段配置 */
  field: FieldSchema;
  /** 当前值 */
  value?: any;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否显示加载状态（select 从字典加载时） */
  loading?: boolean;
  /** 格式化展示值（仅影响展示，不影响提交值） */
  formatValue?: (val: any) => string;
}

const props = withDefaults(defineProps<Props>(), {
  value: undefined,
  disabled: false,
  loading: false,
});

const emit = defineEmits<{
  (e: 'update', value: any): void;
  (e: 'change', value: any): void;
}>();

// ==================== 字段类型解析 ====================

/** 兼容多种字段命名 */
const fieldCode = computed(() => props.field?.field ?? props.field?.code ?? '');
const fieldLabel = computed(() => props.field?.label ?? props.field?.title ?? fieldCode.value);

/** 统一字段类型：fieldType > dataType > formType */
const fieldType = computed(() => {
  const t = props.field?.fieldType ?? props.field?.dataType ?? props.field?.formType ?? '';
  const lower = String(t).trim().toLowerCase();
  // 统一映射
  const typeMap: Record<string, string> = {
    text: 'text',
    input: 'text',
    string: 'text',
    textarea: 'textarea',
    number: 'number',
    int: 'number',
    long: 'number',
    decimal: 'number',
    double: 'number',
    float: 'number',
    select: 'select',
    enum: 'select',
    switch: 'switch',
    boolean: 'switch',
    bool: 'switch',
    toggle: 'switch',
  };
  return typeMap[lower] || 'text';
});

// ==================== 选项数据（字典 / 静态） ====================

const optionsLoading = ref(false);
const remoteOptions = ref<Option[]>([]);

/** 合并选项：remote > field.options > field.dataSource */
const mergedOptions = computed<Option[]>(() => {
  const staticOpts = props.field?.options ?? props.field?.dataSource ?? [];
  const remoteOpts = remoteOptions.value;
  if (remoteOpts.length) return remoteOpts;
  if (staticOpts.length) return staticOpts;
  return [];
});

/** placeholder */
const inputPlaceholder = computed(() => {
  if (props.field?.placeholder) return props.field.placeholder;
  const type = fieldType.value;
  if (type === 'select') return '请选择';
  if (type === 'textarea') return '请输入';
  return `请输入${fieldLabel.value}`;
});

// ==================== 字典加载 ====================

/** 远程加载字典选项 */
async function loadDictOptions(dictType: string) {
  if (!dictType) return;
  const cacheKey = `dict:${dictType}`;
  if (optionsCache[cacheKey]) {
    remoteOptions.value = optionsCache[cacheKey];
    return;
  }
  if (loadingSet.has(cacheKey)) return;

  optionsLoading.value = true;
  loadingSet.add(cacheKey);
  try {
    const res = await requestClient.get<any>(`/api/system/dict/data/${dictType}`);
    const list = normalizeDictData(res);
    optionsCache[cacheKey] = list;
    remoteOptions.value = list;
  } catch {
    remoteOptions.value = [];
  } finally {
    optionsLoading.value = false;
    loadingSet.delete(cacheKey);
  }
}

/** 归一化字典响应 */
function normalizeDictData(data: any): Option[] {
  const list = data?.data ?? data?.rows ?? data ?? [];
  if (!Array.isArray(list)) return [];
  return list.map((item: any) => ({
    label: item.label ?? item.name ?? item.title ?? String(item.value ?? ''),
    value: item.value ?? item.code ?? item.id ?? item.key ?? '',
  }));
}

// 字典缓存（页面级别）
const optionsCache: Record<string, Option[]> = {};
const loadingSet = new Set<string>();

// 当 dictType 变化时自动加载
watch(
  () => props.field?.dictType,
  (dictType) => {
    if (dictType && !mergedOptions.value.length) {
      loadDictOptions(dictType);
    }
  },
  { immediate: true },
);

// 也监听 options/dataSource 变化
watch(
  () => [props.field?.options, props.field?.dataSource],
  () => {
    remoteOptions.value = [];
  },
);

// ==================== 值处理 ====================

/** 展示用的值（用于 Input/Select 等受控组件） */
const normalizedValue = computed(() => {
  const val = props.value;
  const type = fieldType.value;

  if (type === 'select') {
    return val != null ? String(val) : undefined;
  }
  if (type === 'switch') {
    return val === 1 || val === true || val === 'true';
  }
  return val;
});

/** 提交用的值（处理类型转换） */
function normalizeSubmitValue(raw: any): any {
  const type = fieldType.value;
  if (type === 'select') {
    if (raw === undefined || raw === null || raw === '') return undefined;
    return String(raw);
  }
  if (type === 'switch') {
    return raw ? 1 : 0;
  }
  if (type === 'number') {
    const n = Number(raw);
    return Number.isNaN(n) ? undefined : n;
  }
  return raw;
}

/** emit update */
function handleUpdate(val: any) {
  const submitVal = normalizeSubmitValue(val);
  emit('update', submitVal);
  emit('change', submitVal);
}

/** emit change（部分组件 change 和 update 行为一致） */
function handleChange(val: any) {
  const submitVal = normalizeSubmitValue(val);
  emit('change', submitVal);
}

// ==================== 组件映射 ====================

/** 字段类型 → 组件名 */
const currentComponent = computed(() => {
  const type = fieldType.value;
  const map: Record<string, any> = {
    text: Input,
    textarea: Input.TextArea,
    number: InputNumber,
    select: Select,
    switch: Switch,
  };
  return map[type] || Input;
});

/** 组件 Props */
const currentProps = computed(() => {
  const type = fieldType.value;
  const opts = mergedOptions.value;

  if (type === 'textarea') {
    return {
      placeholder: inputPlaceholder.value,
      rows: 3,
      'show-count': false,
      'auto-size': { minRows: 2, maxRows: 6 },
    };
  }

  if (type === 'number') {
    return {
      class: 'w-full',
      placeholder: inputPlaceholder.value,
      precision: undefined,
      controls: false,
    };
  }

  if (type === 'select') {
    return {
      placeholder: inputPlaceholder.value,
      options: opts,
      'show-search': true,
      'allow-clear': true,
      'option-filter-prop': 'label',
      'filter-option': (input: string, option: any) => {
        const label = option?.label != null ? String(option.label) : '';
        return label.toLowerCase().includes(input.toLowerCase());
      },
      'not-found-content': optionsLoading.value ? '加载中…' : '暂无数据',
    };
  }

  if (type === 'switch') {
    return {
      'checked-children': '是',
      'un-checked-children': '否',
    };
  }

  // text
  return {
    placeholder: inputPlaceholder.value,
  };
});
</script>

<style scoped>
.w-full {
  width: 100%;
}
</style>
