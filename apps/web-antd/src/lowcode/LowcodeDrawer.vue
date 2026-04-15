<!--
  LowcodeDrawer - 低代码表单抽屉
  封装 DynamicFormDefinitionPage，支持从后端 meta 配置渲染表单

  用法：
  <LowcodeDrawer
    v-model:open="drawerVisible"
    table-code="WMS0010"
    :record="currentRecord"
    @success="onFormSuccess"
  />
-->
<template>
  <Drawer
    v-model:open="internalOpen"
    :title="drawerTitle"
    :width="width"
    :fullscreen="internalFullscreen"
    :destroy-on-close="true"
    :mask-closable="false"
    @close="handleClose"
  >
    <template #extra>
      <Tooltip :title="internalFullscreen ? '退出全屏' : '全屏'">
        <Button type="text" @click="toggleFullscreen">
          <IconifyIcon :icon="internalFullscreen ? 'material-symbols:fullscreen-exit' : 'material-symbols:fullscreen'" />
        </Button>
      </Tooltip>
    </template>
    <Spin :spinning="loading">
      <!-- 表单定义页面（复用现有组件） -->
      <DynamicFormDefinitionPage
        ref="formPageRef"
        :fetch-definition="buildFetchDefinition"
        :params="formParams"
        :readonly="readonly"
        :on-save="handleSave"
        :on-cancel="handleClose"
      />
    </Spin>
  </Drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Button, Drawer, Spin, Tooltip } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { requestClient } from '#/api/request';
import DynamicFormDefinitionPage from '#/components/DynamicFormDefinitionPage.vue';

interface Props {
  /** 抽屉是否打开 */
  open: boolean;
  /** 表编码，对应后端 sys_table_meta.table_code */
  tableCode: string;
  /** 当前编辑记录（null 表示新增） */
  record?: Record<string, any> | null;
  /** 抽屉宽度 */
  width?: number | string;
  /** 是否全屏 */
  fullscreen?: boolean;
  /** 只读模式 */
  readonly?: boolean;
  /** 表单定义接口路径（默认使用通用 meta 接口） */
  formDefinitionUrl?: string;
  /** 提交接口路径（默认使用通用 CRUD） */
  submitUrl?: string;
  /** 提交方法：POST 新增，PUT 修改 */
  submitMethod?: 'post' | 'put';
}

const props = withDefaults(defineProps<Props>(), {
  width: 600,
  fullscreen: false,
  readonly: false,
  submitMethod: 'post',
});

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'update:fullscreen', value: boolean): void;
  (e: 'success', record: Record<string, any>): void;
  (e: 'error', err: any): void;
  (e: 'close'): void;
}>();

const internalOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val),
});

const internalFullscreen = ref(false);

const loading = ref(false);
const formPageRef = ref();
const drawerTitle = computed(() => {
  if (props.readonly) return '详情';
  return props.record?.id ? '编辑' : '新建';
});

const formParams = computed(() => ({
  tableCode: props.tableCode,
  id: props.record?.id,
}));

/** 构建表单定义接口（复用现有 DynamicFormDefinitionPage 的 fetchDefinition 签名） */
async function buildFetchDefinition(params: Record<string, any>): Promise<Record<string, any>> {
  const tableCode = props.tableCode;
  const url = props.formDefinitionUrl ?? '/api/system/meta/column/schema';

  const queryParams = params?.id
    ? { tableCode, id: params.id }
    : { tableCode };

  const res = await requestClient.get<any>(url, { params: queryParams });

  // 调试：打印原始 API 响应
  if (import.meta.env.DEV) {
    console.log('[LowcodeDrawer] API raw response:', JSON.stringify(res, null, 2));
  }

  // 标准化返回数据格式
  // 后端返回可能是数组 [ColumnMetaVO] 或已包装的对象 { basicInfo: { fields: [...] } }
  let normalized = normalizeResponse(res);

  // 调试：打印标准化后的字段类型
  if (import.meta.env.DEV) {
    const sections = normalized;
    for (const [secKey, sec] of Object.entries(sections)) {
      if (sec && typeof sec === 'object' && Array.isArray((sec as any).fields)) {
        for (const f of (sec as any).fields) {
          console.log(`[LowcodeDrawer] field: ${f.fieldCode}, fieldType: ${f.fieldType}, options: ${JSON.stringify(f.options)}, apiUrl: ${f.apiUrl}`);
        }
      }
    }
  }

  // 如果有 record（编辑模式），需要额外获取详情数据
  if (props.record?.id) {
    const detailUrl = `${inferDetailUrl()}/${props.record.id}`;
    try {
      const detailRes = await requestClient.get<any>(detailUrl);
      const detail = detailRes?.data ?? detailRes ?? {};
      // 合并详情数据到 normalized
      normalized = mergeDetailData(normalized, detail);
    } catch {
      // 忽略详情加载失败
    }
  }

  return normalized;
}

/**
 * 标准化后端响应
 * 后端返回数组 [ColumnMetaVO] → 转换为 { basicInfo: { fields: [...] } }
 * 后端返回对象 { basicInfo: { fields: [...] } } → 直接返回
 */
function normalizeResponse(res: any): Record<string, any> {
  // 已经是对象格式（前端期望的格式），直接返回
  if (res && typeof res === 'object' && !Array.isArray(res)) {
    // 检查是否已经是区块格式
    const keys = Object.keys(res);
    const hasSectionFormat = keys.some((k) => {
      const v = res[k];
      return v && typeof v === 'object' && Array.isArray(v.fields || v.items || v.fieldList);
    });
    if (hasSectionFormat) {
      return res;
    }
  }

  // 处理数组格式：[{ code, label, type, formType, ... }]
  if (Array.isArray(res)) {
    const defaultSection: Record<string, any> = {
      fields: res.map((col: any, idx: number) => ({
        fieldCode: col.code ?? col.field ?? `field_${idx}`,
        fieldName: col.label ?? col.title ?? col.fieldCode ?? '',
        fieldType: mapFieldType(col.formType ?? col.type),
        isRequired: col.isRequired === true || col.isRequired === 1,
        defaultValue: col.defaultValue,
        options: col.options,
        apiUrl: col.apiUrl,
        dictType: col.dictType,
        colSpan: col.colSpan ?? col.formColSpan ?? col.form_col_span ?? 6,
        sortNum: col.sortOrder ?? idx,
      })),
    };

    // 将详情数据提取出来放在 basicInfo 同级（mergeDetailData 会处理）
    return { basicInfo: defaultSection };
  }

  // 其他情况返回空结构
  return { basicInfo: { fields: [] } };
}

/**
 * 映射表单类型
 */
function mapFieldType(type?: string): string {
  if (!type) return 'text';
  const lower = type.toLowerCase();
  const map: Record<string, string> = {
    input: 'text',
    text: 'text',
    textarea: 'textarea',
    select: 'select',
    date: 'date',
    datetime: 'datetime',
    number: 'number',
    switch: 'select',
    treeselect: 'treeSelect',
  };
  return map[lower] ?? 'text';
}

/**
 * 合并详情数据到表单定义
 * 将详情数据的字段值填充到 basicInfo.fields 对应的默认值中
 * 新增模式时，为 switch/bool 类型字段设置默认值 true
 */
function mergeDetailData(normalized: Record<string, any>, detail: Record<string, any>): Record<string, any> {
  // 找出 basicInfo 或其他区块
  for (const key of Object.keys(normalized)) {
    const section = normalized[key];
    if (section && typeof section === 'object' && Array.isArray(section.fields)) {
      // 填充详情值
      section.fields.forEach((field: any) => {
        const fieldCode = field.fieldCode;
        if (fieldCode && detail[fieldCode] !== undefined) {
          field.defaultValue = detail[fieldCode];
        } else if (!props.record?.id) {
          // 新增模式：为 switch/bool 类型字段设置默认值 true
          const lower = (field.fieldType || '').toLowerCase();
          if (lower === 'select' || lower === 'switch' || fieldCode === 'isEnabled') {
            field.defaultValue = true;
          }
        }
      });
    }
  }
  return normalized;
}

function inferDetailUrl(): string {
  // 精确匹配：tableCode → 接口路径
  const urlMap: Record<string, string> = {
    WMS0010: '/api/base/warehouse',
    WMS0030: '/api/base/material',
    inv_warehouse: '/api/base/warehouse',
    inv_material: '/api/base/material',
    sys_user: '/api/system/user',
    sys_role: '/api/system/role',
  };

  if (urlMap[props.tableCode]) {
    return urlMap[props.tableCode];
  }

  // 兜底：WMS开头则去掉前缀映射，否则保留原名转小写
  if (/^WMS\d+$/.test(props.tableCode)) {
    return `/api/base/${props.tableCode.replace(/^WMS/, '').toLowerCase()}`;
  }

  // 其他情况：取 tableCode 最后一段（支持 inv_warehouse → warehouse）
  const segments = props.tableCode.split('_');
  const entityName = segments[segments.length - 1];
  return `/api/base/${entityName}`;
}

/** 获取提交接口 URL */
function getSubmitUrl(): string {
  if (props.submitUrl) return props.submitUrl;
  const base = inferDetailUrl();
  if (props.record?.id) {
    return `${base}/${props.record.id}`;
  }
  return base;
}

/** 提交保存 */
async function handleSave(model: Record<string, any>) {
  loading.value = true;
  try {
    const url = getSubmitUrl();
    const method = props.submitMethod ?? (props.record?.id ? 'put' : 'post');

    if (method === 'put') {
      await requestClient.put<any>(url, model);
    } else {
      await requestClient.post<any>(url, model);
    }

    emit('success', model);
    handleClose();
  } catch (e: any) {
    const msg = e?.response?.data?.msg ?? e?.data?.msg ?? e?.message ?? '保存失败';
    emit('error', e);
    throw new Error(msg); // 抛出错误，阻止抽屉关闭
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  internalOpen.value = false;
  internalFullscreen.value = false;
  emit('close');
}

/** 主动触发保存（供父组件调用，如点击抽屉外部确认） */
async function submit() {
  await formPageRef.value?.handleSave?.();
}

/** 重置表单 */
function reset() {
  formPageRef.value?.reload?.();
}

/** 切换全屏 */
function toggleFullscreen() {
  internalFullscreen.value = !internalFullscreen.value;
}

defineExpose({ submit, reset, toggleFullscreen });
</script>
