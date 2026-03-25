<template>
  <div class="data-permission-page">
    <!-- 搜索栏 -->
    <LcSearchBar
      ref="searchBarRef"
      :fields="searchFields"
      :columns="4"
      @search="handleSearch"
      @reset="handleReset"
    />

    <!-- 表格 -->
    <LcTable
      ref="tableRef"
      :columns="tableColumns"
      :api="permissionApi"
      :actions="tableActions"
      :query-params="queryParams"
      :perm-prefix="permPrefix"
      @edit="handleEdit"
      @delete="handleDelete"
    />

    <!-- 表单弹窗 -->
    <LcForm
      ref="formRef"
      :fields="formFields"
      :api="formApi"
      mode="modal"
      @success="handleFormSuccess"
    />
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { ref, computed } from 'vue';
import { message } from 'ant-design-vue';
import { $t } from '#/locales';
import { LcTable, LcForm, LcSearchBar } from '#/components/lc';
import type { LcTableColumn, LcTableAction, LcFormField, LcSearchField } from '#/components/lc';
import type { LcCrudApi } from '#/components/lc/types';

interface Props {
  // 权限类型：user | dept | role | company
  permissionType: string;
  // API 函数
  listApi: (params: any) => Promise<any>;
  detailApi: (id: number) => Promise<any>;
  createApi: (data: T) => Promise<any>;
  updateApi: (id: number, data: Partial<T>) => Promise<any>;
  deleteApi: (id: number) => Promise<any>;
  // 主键字段名
  keyField: string;
  keyFieldLabel: string;
  // 权限范围字典
  dataScopeOptions: Array<{ label: string; value: string }>;
  // 权限前缀
  permPrefix: string;
}

const props = defineProps<Props>();

// Refs
const tableRef = ref();
const formRef = ref();
const searchBarRef = ref();

// 查询参数
const queryParams = ref<Record<string, any>>({});

// 表格数据 API
const permissionApi: LcCrudApi<T> = {
  page: async (params: any) => {
    const res = await props.listApi(params);
    return {
      rows: res.list || [],
      total: res.total || 0,
    };
  },
  get: (id: any) => {
    return props.detailApi(id);
  },
  delete: (id: any) => {
    return props.deleteApi(id);
  },
};

// 表单数据 API
const formApi = {
  add: async (data: any) => {
    return await props.createApi(data);
  },
  edit: async (data: any) => {
    const { id, ...rest } = data;
    return await props.updateApi(id, rest);
  },
};

// 表格列配置
const tableColumns = computed<LcTableColumn[]>(() => [
  { field: 'id', title: $t('page.common.id'), width: 80, align: 'center' },
  { field: props.keyField + 'Name', title: props.keyFieldLabel, minWidth: 120 },
  { field: 'tableCode', title: $t('page.system.dataPermission.tableCode'), minWidth: 150 },
  { field: 'dataScopeName', title: $t('page.system.dataPermission.dataScope'), width: 120 },
  {
    field: 'deptWhitelist',
    title: $t('page.system.dataPermission.deptWhitelist'),
    width: 150,
    formatter: (row: T) => {
      if (!row.deptWhitelist || row.deptWhitelist.length === 0) {
        return '-';
      }
      return row.deptWhitelist.join(', ');
    },
  },
  {
    field: 'deptBlacklist',
    title: $t('page.system.dataPermission.deptBlacklist'),
    width: 150,
    formatter: (row: T) => {
      if (!row.deptBlacklist || row.deptBlacklist.length === 0) {
        return '-';
      }
      return row.deptBlacklist.join(', ');
    },
  },
  {
    field: 'customSql',
    title: $t('page.system.dataPermission.customSql'),
    minWidth: 200,
    formatter: (row: T) => {
      return row.customSql || '-';
    },
  },
  {
    field: 'status',
    title: $t('page.common.status'),
    width: 80,
    align: 'center',
    formatter: (row: T) => {
      return row.status === 1
        ? '<span style="color: green">' + $t('page.common.enabled') + '</span>'
        : '<span style="color: red">' + $t('page.common.disabled') + '</span>';
    },
  },
  { field: 'remark', title: $t('page.common.remark'), minWidth: 150 },
]);

// 表格操作按钮
const tableActions: LcTableAction[] = [
  { key: 'edit', label: $t('page.common.edit'), perm: 'edit' },
  { key: 'delete', label: $t('page.common.delete'), perm: 'delete', danger: true },
];

// 表单字段配置
const formFields = computed<LcFormField[]>(() => [
  {
    fieldCode: props.keyField,
    fieldName: props.keyFieldLabel,
    fieldType: 'number',
    required: true,
    component: 'a-input-number',
  },
  {
    fieldCode: 'tableCode',
    fieldName: $t('page.system.dataPermission.tableCode'),
    fieldType: 'string',
    required: true,
    maxLength: 100,
  },
  {
    fieldCode: 'dataScope',
    fieldName: $t('page.system.dataPermission.dataScope'),
    fieldType: 'select',
    required: true,
    options: props.dataScopeOptions,
  },
  {
    fieldCode: 'deptWhitelist',
    fieldName: $t('page.system.dataPermission.deptWhitelist'),
    fieldType: 'array',
    component: 'a-select',
    mode: 'multiple',
    placeholder: $t('page.system.dataPermission.deptWhitelistPlaceholder'),
  },
  {
    fieldCode: 'deptBlacklist',
    fieldName: $t('page.system.dataPermission.deptBlacklist'),
    fieldType: 'array',
    component: 'a-select',
    mode: 'multiple',
    placeholder: $t('page.system.dataPermission.deptBlacklistPlaceholder'),
  },
  {
    fieldCode: 'userWhitelist',
    fieldName: $t('page.system.dataPermission.userWhitelist'),
    fieldType: 'array',
    component: 'a-select',
    mode: 'multiple',
  },
  {
    fieldCode: 'userBlacklist',
    fieldName: $t('page.system.dataPermission.userBlacklist'),
    fieldType: 'array',
    component: 'a-select',
    mode: 'multiple',
  },
  {
    fieldCode: 'customSql',
    fieldName: $t('page.system.dataPermission.customSql'),
    fieldType: 'textarea',
    placeholder: $t('page.system.dataPermission.customSqlPlaceholder'),
    rows: 4,
  },
  {
    fieldCode: 'status',
    fieldName: $t('page.common.status'),
    fieldType: 'boolean',
    defaultValue: 1,
  },
  {
    fieldCode: 'remark',
    fieldName: $t('page.common.remark'),
    fieldType: 'textarea',
    maxLength: 500,
  },
]);

// 搜索字段配置
const searchFields = computed<LcSearchField[]>(() => [
  {
    fieldCode: props.keyField,
    fieldName: props.keyFieldLabel,
    fieldType: 'number',
  },
  {
    fieldCode: 'tableCode',
    fieldName: $t('page.system.dataPermission.tableCode'),
    fieldType: 'string',
  },
  {
    fieldCode: 'dataScope',
    fieldName: $t('page.system.dataPermission.dataScope'),
    fieldType: 'select',
    options: props.dataScopeOptions,
  },
  {
    fieldCode: 'status',
    fieldName: $t('page.common.status'),
    fieldType: 'select',
    options: [
      { label: $t('page.common.enabled'), value: 1 },
      { label: $t('page.common.disabled'), value: 0 },
    ],
  },
]);

// 查询
function handleSearch(values: Record<string, any>) {
  queryParams.value = { ...values };
  tableRef.value.value?.query();
}

// 重置
function handleReset() {
  queryParams.value = {};
  tableRef.value.value?.query();
}

// 编辑
function handleEdit(row: T) {
  formRef.value.value?.openEdit(row);
}

// 删除
async function handleDelete(row: T) {
  try {
    await props.deleteApi(row.id!);
    message.success($t('page.common.deleteSuccess'));
    tableRef.value.value?.reload();
  } catch (error) {
    // Error handling
  }
}

// 表单提交成功
function handleFormSuccess() {
  message.success($t('page.common.saveSuccess'));
  tableRef.value.value?.reload();
}
</script>

<style scoped>
.data-permission-page {
  padding: 16px;
}
</style>
