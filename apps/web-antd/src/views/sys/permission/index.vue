<template>
  <div class="sys-permission-page">
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
      perm-prefix="wms:base:permission"
      @edit="handleEdit"
      @delete="handleDelete"
      @selection-change="handleSelectionChange"
    >
      <template #toolbar-tools>
        <Button
          v-access:code="'wms:base:permission:export'"
          @click="handleExport"
        >
          {{ $t('page.common.export') }}
        </Button>
      </template>
    </LcTable>

    <!-- 表单弹窗 -->
    <LcForm
      ref="formRef"
      :fields="formFields"
      :api="permissionApi"
      mode="modal"
      @success="handleFormSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { message, Button } from 'ant-design-vue';
import { LcTable, LcForm, LcSearchBar } from '#/components/lc';
import {
  getPermissionTree,
  getPermissionById,
  addPermission,
  updatePermission,
  deletePermission,
} from '#/api/sys/permission';
import type { LcTableColumn, LcTableAction, LcFormField, LcSearchField } from '#/components/lc';
import type { LcCrudApi } from '#/components/lc/types';

/**
 * 权限数据类型
 */
export interface PermissionResult {
  permission_id?: number;
  permission_code: string;
  permission_name: string;
  permission_type?: string;
  parent_id?: number;
  sort?: number;
  is_enabled?: number;
  remark?: string;
  create_by?: string;
  create_time?: string;
  update_by?: string;
  update_time?: string;
}

// Refs
const tableRef = ref();
const formRef = ref();
const searchBarRef = ref();

// 查询参数
const queryParams = ref<Record<string, any>>({});

// 构建 CRUD API
const permissionApi: LcCrudApi<PermissionResult> = {
  page: async (params: any) => {
    const res = await getPermissionTree(params);
    return {
      rows: res.rows || res.list || [],
      total: res.total || 0,
    };
  },
  get: async (id: any) => {
    return await getPermissionById(id);
  },
  add: async (data: any) => {
    return await addPermission(data);
  },
  edit: async (data: any) => {
    return await updatePermission(data);
  },
  delete: async (id: any) => {
    return await deletePermission(id);
  },
  export: async (params: any) => {
    return await exportPermission(params);
  },
};

// 表格列配置
const tableColumns: LcTableColumn[] = [
  { field: 'permission_code', title: $t('page.system.permission.permissionCode'), minWidth: 150 },
  { field: 'permission_name', title: $t('page.system.permission.permissionName'), minWidth: 150 },
  { field: 'permission_type', title: $t('page.system.permission.permissionType'), width: 120 },
  { field: 'sort', title: $t('page.system.permission.sort'), width: 80, align: 'center' },
  {
    field: 'is_enabled',
    title: $t('page.common.status'),
    width: 100,
    formatter: (row: PermissionResult) => {
      return row.is_enabled === 1
        ? `<span style="color: green">${$t('page.common.enabled')}</span>`
        : `<span style="color: red">${$t('page.common.disabled')}</span>`;
    },
  },
  { field: 'remark', title: $t('page.common.remark'), minWidth: 150 },
  { field: 'create_by', title: $t('page.system.permission.createBy'), minWidth: 100 },
  { field: 'create_time', title: $t('page.system.permission.createTime'), minWidth: 180 },
];

// 表格操作按钮
const tableActions: LcTableAction[] = [
  { key: 'edit', label: $t('page.common.edit'), perm: 'edit' },
  { key: 'delete', label: $t('page.common.delete'), perm: 'delete', danger: true },
  {
    key: 'export',
    label: $t('page.common.export'),
    perm: 'export',
    onClick: () => handleExport(),
  },
];

// 表单字段配置
const formFields: LcFormField[] = [
  {
    fieldCode: 'permission_code',
    fieldName: $t('page.system.permission.permissionCode'),
    fieldType: 'string',
    required: true,
    maxLength: 50,
  },
  {
    fieldCode: 'permission_name',
    fieldName: $t('page.system.permission.permissionName'),
    fieldType: 'string',
    required: true,
    maxLength: 100,
  },
  {
    fieldCode: 'permission_type',
    fieldName: $t('page.system.permission.permissionType'),
    fieldType: 'string',
    maxLength: 20,
  },
  {
    fieldCode: 'sort',
    fieldName: $t('page.system.permission.sort'),
    fieldType: 'number',
  },
  {
    fieldCode: 'is_enabled',
    fieldName: $t('page.system.permission.isEnabled'),
    fieldType: 'boolean',
    defaultValue: 1,
  },
  {
    fieldCode: 'remark',
    fieldName: $t('page.common.remark'),
    fieldType: 'textarea',
    maxLength: 500,
  },
];

// 搜索字段配置
const searchFields: LcSearchField[] = [
  {
    fieldCode: 'permission_code',
    fieldName: $t('page.system.permission.permissionCode'),
    fieldType: 'string',
  },
  {
    fieldCode: 'permission_name',
    fieldName: $t('page.system.permission.permissionName'),
    fieldType: 'string',
  },
];

// 查询
function handleSearch(values: Record<string, any>) {
  queryParams.value = { ...values };
  tableRef.value?.query();
}

// 重置
function handleReset() {
  queryParams.value = {};
  tableRef.value?.query();
}

// 导出
async function handleExport() {
  try {
    const blob = await permissionApi.export!(queryParams.value);

    // 下载文件
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `permissions_${new Date().getTime()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    message.success($t('page.message.exportSuccess'));
  } catch (error) {
    console.error('Export failed:', error);
    message.error($t('page.message.exportFail'));
  }
}

// 编辑
function handleEdit(row: PermissionResult) {
  formRef.value?.openEdit(row);
}

// 删除
async function handleDelete(row: PermissionResult) {
  console.log('删除权限:', row);
}

// 表单提交成功
function handleFormSuccess() {
  message.success($t('page.message.operationSuccess'));
  tableRef.value?.reload();
}

// 选中变化
function handleSelectionChange(rows: PermissionResult[]) {
  console.log('选中行:', rows);
}
</script>

<style scoped>
.sys-permission-page {
  padding: 16px;
}
</style>
