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
  <a-drawer
    v-model:open="internalOpen"
    :title="drawerTitle"
    :width="drawerWidth"
    :destroy-on-close="true"
    :mask-closable="false"
    @close="handleClose"
  >
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
  </a-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Spin } from 'ant-design-vue';
import { Drawer as ADrawer } from 'ant-design-vue';
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
  readonly: false,
  submitMethod: 'post',
});

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'success', record: Record<string, any>): void;
  (e: 'error', err: any): void;
  (e: 'close'): void;
}>();

const internalOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val),
});

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
  // 默认使用后端通用字段 Schema 接口
  // 该接口返回 { rows: ColumnMeta[] }，DynamicFormDefinitionPage 会自动解析
  const tableCode = props.tableCode;
  const url = props.formDefinitionUrl ?? '/api/system/meta/column/schema';

  const queryParams = params?.id
    ? { tableCode, id: params.id }
    : { tableCode };

  const res = await requestClient.get<any>(url, { params: queryParams });

  // 如果有 record（编辑模式），需要额外获取详情数据
  if (props.record?.id) {
    const detailUrl = `${inferDetailUrl()}/${props.record.id}`;
    try {
      const detailRes = await requestClient.get<any>(detailUrl);
      const detail = detailRes?.data ?? detailRes ?? {};
      // 合并：schema（用于渲染字段）+ 详情数据（用于填充表单）
      return { ...res, ...detail };
    } catch {
      return res;
    }
  }

  return res;
}

function inferDetailUrl(): string {
  // 根据 tableCode 推断详情接口（需与后端协商约定）
  const urlMap: Record<string, string> = {
    WMS0010: '/api/base/warehouse',
    WMS0030: '/api/base/material',
  };
  return urlMap[props.tableCode] ?? `/api/base/${props.tableCode.replace(/^WMS\d+$/, (m) => m.replace(/^WMS/, '').toLowerCase())}`;
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

defineExpose({ submit, reset });
</script>
