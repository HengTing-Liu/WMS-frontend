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
      perm-prefix="wms:sys:data-permission:user"
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

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { LcTable, LcForm, LcSearchBar } from '#/components/lc';
import {
  getUserPermissionList,
  getUserPermissionDetail,
  createUserPermission,
  updateUserPermission,
  deleteUserPermission,
  getDataScopeDict,
  type UserDataPermission,
} from '#/api/sys/data-permission/user-permission';
import type { LcTableColumn, LcTableAction, LcFormField, LcSearchField } from '#/components/lc';
import type { LcCrudApi } from '#/components/lc/types';

// 权限范围字典
const dataScopeOptions = ref<Array<{ label: string; value: string }>>([]);

// Refs
const tableRef = ref();
const formRef = ref();
const searchBarRef = ref();

// 查询参数
const queryParams = ref<Record<string, any>>({});

// 表格数据 API
const permissionApi: LcCrudApi<UserDataPermission> = {
  page: async (params: any) => {
    const res = await getUserPermissionList(params);
    return {
      rows: res.list || [],
      total: res.total || 0,
    };
  },
  get: async (id: any) => {
    return await getUserPermissionDetail(id);
  },
  delete: async (id: any) => {
    return await deleteUserPermission(id);
  },
};

// 表单数据 API（单独处理，因为需要根据是否有ID来区分新增/更新）
const formApi = {
  add: async (data: any) => {
    return await createUserPermission(data);
  },
  edit: async (data: any) => {
    const { id, ...rest } = data;
    return await updateUserPermission(id, rest);
  },
};

// 表格列配置
const tableColumns: LcTableColumn[] = [
  { field: 'id', title: $t('page.common.id'), width: 80, align: 'center' },
  { field: 'userName', title: $t('page.dataPermission.user'), minWidth: 120 },
  { field: 'tableCode', title: $t('page.dataPermission.tableCode'), minWidth: 150 },
  { field: 'dataScopeName', title: $t('page.dataPermission.dataScope'), width: 120 },
  {
    field: 'deptWhitelist',
    title: $t('page.dataPermission.deptWhitelist'),
    width: 150,
    formatter: (row: UserDataPermission) => {
      if (!row.deptWhitelist || row.deptWhitelist.length === 0) {
        return '-';
      }
      return row.deptWhitelist.join(', ');
    },
  },
  {
    field: 'deptBlacklist',
    title: $t('page.dataPermission.deptBlacklist'),
    width: 150,
    formatter: (row: UserDataPermission) => {
      if (!row.deptBlacklist || row.deptBlacklist.length === 0) {
        return '-';
      }
      return row.deptBlacklist.join(', ');
    },
  },
  {
    field: 'customSql',
    title: $t('page.dataPermission.customSql'),
    minWidth: 200,
    formatter: (row: UserDataPermission) => {
      return row.customSql || '-';
    },
  },
  {
    field: 'status',
    title: $t('page.common.status'),
    width: 80,
    align: 'center',
    formatter: (row: UserDataPermission) => {
      return row.status === 1
        ? '<span style="color: green">' + $t('page.common.enabled') + '</span>'
        : '<span style="color: red">' + $t('page.common.disabled') + '</span>';
    },
  },
  { field: 'remark', title: $t('page.common.remark'), minWidth: 150 },
];

// 表格操作按钮
const tableActions: LcTableAction[] = [
  { key: 'edit', label: $t('page.common.edit'), perm: 'edit' },
  { key: 'delete', label: $t('page.common.delete'), perm: 'delete', danger: true },
];

// 表单字段配置
const formFields: LcFormField[] = [
  {
    fieldCode: 'userId',
    fieldName: $t('page.dataPermission.user'),
    fieldType: 'number',
    required: true,
    component: 'a-input-number',
  },
  {
    fieldCode: 'tableCode',
    fieldName: $t('page.dataPermission.tableCode'),
    fieldType: 'string',
    required: true,
    maxLength: 100,
  },
  {
    fieldCode: 'dataScope',
    fieldName: $t('page.dataPermission.dataScope'),
    fieldType: 'select',
    required: true,
    options: dataScopeOptions.value,
  },
  {
    fieldCode: 'deptWhitelist',
    fieldName: $t('page.dataPermission.deptWhitelist'),
    fieldType: 'array',
    component: 'a-select',
    mode: 'multiple',
    placeholder: $t('page.dataPermission.deptWhitelistPlaceholder'),
  },
  {
    fieldCode: 'deptBlacklist',
    fieldName: $t('page.dataPermission.deptBlacklist'),
    fieldType: 'array',
    component: 'a-select',
    mode: 'multiple',
    placeholder: $t('page.dataPermission.deptBlacklistPlaceholder'),
  },
  {
    fieldCode: 'userWhitelist',
    fieldName: $t('page.dataPermission.userWhitelist'),
    fieldType: 'array',
    component: 'a-select',
    mode: 'multiple',
  },
  {
    fieldCode: 'userBlacklist',
    fieldName: $t('page.dataPermission.userBlacklist'),
    fieldType: 'array',
    component: 'a-select',
    mode: 'multiple',
  },
  {
    fieldCode: 'customSql',
    fieldName: $t('page.dataPermission.customSql'),
    fieldType: 'textarea',
    placeholder: $t('page.dataPermission.customSqlPlaceholder'),
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
];

// 搜索字段配置
const searchFields: LcSearchField[] = [
  {
    fieldCode: 'userId',
    fieldName: $t('page.dataPermission.user'),
    fieldType: 'number',
  },
  {
    fieldCode: 'tableCode',
    fieldName: $t('page.dataPermission.tableCode'),
    fieldType: 'string',
  },
  {
    fieldCode: 'dataScope',
    fieldName: $t('page.dataPermission.dataScope'),
    fieldType: 'select',
    options: dataScopeOptions.value,
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
];

// 加载权限范围字典
async function loadDataScopeDict() {
  try {
    const res = await getDataScopeDict();
    dataScopeOptions.value = res.data || [];
    // 更新表单和搜索字段的选项
    const scopeField = formFields.find((f) => f.fieldCode === 'dataScope');
    if (scopeField) {
      scopeField.options = dataScopeOptions.value;
    }
    const searchScopeField = searchFields.find((f) => f.fieldCode === 'dataScope');
    if (searchScopeField) {
      searchScopeField.options = dataScopeOptions.value;
    }
  } catch (error) {
    // Error handling
  }
}

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

// 编辑
function handleEdit(row: UserDataPermission) {
  formRef.value?.openEdit(row);
}

// 删除
async function handleDelete(row: UserDataPermission) {
  try {
    await deleteUserPermission(row.id!);
    message.success($t('page.common.deleteSuccess'));
    tableRef.value?.reload();
  } catch (error) {
    // Error handling
  }
}

// 表单提交成功
function handleFormSuccess() {
  message.success($t('page.common.saveSuccess'));
  tableRef.value?.reload();
}

// 页面加载
onMounted(() => {
  loadDataScopeDict();
});
</script>

<style scoped>
.data-permission-page {
  padding: 16px;
}
</style>
