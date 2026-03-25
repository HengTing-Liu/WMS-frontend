<template>
  <div class="sys-user-page">
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
      :api="userApi"
      :actions="tableActions"
      :query-params="queryParams"
      perm-prefix="sys:user"
      @edit="handleEdit"
      @delete="handleDelete"
      @selection-change="handleSelectionChange"
    />

    <!-- 表单弹窗 -->
    <LcForm
      ref="formRef"
      :fields="formFields"
      :api="userApi"
      mode="modal"
      @success="handleFormSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { message } from 'ant-design-vue';
import { LcTable, LcForm, LcSearchBar } from '#/components/lc';
import { sysUserApi } from '#/api/sys/user';
import type { LcTableColumn, LcTableAction, LcFormField, LcSearchField } from '#/components/lc';
import type { SysUserResult } from '#/api/sys/user';

// Refs
const tableRef = ref();
const formRef = ref();
const searchBarRef = ref();

// 查询参数
const queryParams = ref<Record<string, any>>({});

// 表格列配置
const tableColumns: LcTableColumn[] = [
  { field: 'user_name', title: $t('page.system.user.userName'), minWidth: 120 },
  { field: 'nick_name', title: $t('page.system.user.nickName'), minWidth: 120 },
  { field: 'phonenumber', title: $t('page.system.user.phonenumber'), minWidth: 120 },
  {
    field: 'sex',
    title: $t('page.system.user.sex'),
    width: 100,
    formatter: (row: SysUserResult) => {
      const map: Record<string, string> = {
        '0': $t('page.system.user.sex_0'),
        '1': $t('page.system.user.sex_1'),
        '2': $t('page.system.user.sex_2'),
      };
      return map[row.sex] || '-';
    },
  },
  {
    field: 'status',
    title: $t('page.system.user.status'),
    width: 100,
    formatter: (row: SysUserResult) => {
      return row.status === '0'
        ? `<span style="color: green">${$t('page.system.user.status_0')}</span>`
        : `<span style="color: red">${$t('page.system.user.status_1')}</span>`;
    },
  },
  { field: 'create_by', title: $t('page.system.user.createBy'), minWidth: 100 },
  { field: 'create_time', title: $t('page.system.user.createTime'), minWidth: 180 },
];

// 表格操作按钮
const tableActions: LcTableAction[] = [
  { key: 'edit', label: $t('page.common.edit'), perm: 'edit' },
  { key: 'delete', label: $t('page.common.delete'), perm: 'delete', danger: true },
];

// 表单字段配置
const formFields: LcFormField[] = [
  {
    fieldCode: 'user_name',
    fieldName: $t('page.system.user.userName'),
    fieldType: 'string',
    required: true,
    maxLength: 30,
  },
  {
    fieldCode: 'nick_name',
    fieldName: $t('page.system.user.nickName'),
    fieldType: 'string',
    required: true,
    maxLength: 30,
  },
  {
    fieldCode: 'email',
    fieldName: $t('page.system.user.email'),
    fieldType: 'string',
    maxLength: 50,
  },
  {
    fieldCode: 'phonenumber',
    fieldName: $t('page.system.user.phonenumber'),
    fieldType: 'string',
    maxLength: 11,
  },
  {
    fieldCode: 'sex',
    fieldName: $t('page.system.user.sex'),
    fieldType: 'select',
    options: [
      { label: $t('page.system.user.sex_0'), value: '0' },
      { label: $t('page.system.user.sex_1'), value: '1' },
      { label: $t('page.system.user.sex_2'), value: '2' },
    ],
  },
  {
    fieldCode: 'status',
    fieldName: $t('page.system.user.status'),
    fieldType: 'select',
    options: [
      { label: $t('page.system.user.status_0'), value: '0' },
      { label: $t('page.system.user.status_1'), value: '1' },
    ],
  },
  {
    fieldCode: 'remark',
    fieldName: $t('page.system.user.remark'),
    fieldType: 'textarea',
    maxLength: 500,
  },
];

// 搜索字段配置
const searchFields: LcSearchField[] = [
  {
    fieldCode: 'user_name',
    fieldName: $t('page.system.user.userName'),
    fieldType: 'string',
  },
  {
    fieldCode: 'phonenumber',
    fieldName: $t('page.system.user.phonenumber'),
    fieldType: 'string',
  },
  {
    fieldCode: 'status',
    fieldName: $t('page.system.user.status'),
    fieldType: 'select',
    options: [
      { label: $t('page.system.user.status_0'), value: '0' },
      { label: $t('page.system.user.status_1'), value: '1' },
    ],
  },
];

// 用户 API
const userApi = sysUserApi;

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
function handleEdit(row: SysUserResult) {
  formRef.value?.openEdit(row);
}

// 删除
async function handleDelete(row: SysUserResult) {
  // 删除由 LcTable 内置处理，这里可以添加额外逻辑
  console.log('删除用户:', row);
}

// 表单提交成功
function handleFormSuccess() {
  message.success($t('page.message.operationSuccess'));
  tableRef.value?.reload();
}

// 选中变化
function handleSelectionChange(rows: SysUserResult[]) {
  console.log('选中行:', rows);
}
</script>

<style scoped>
.sys-user-page {
  padding: 16px;
}
</style>
