<template>
  <div class="sys-log-page">
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
      :api="logApi"
      :actions="tableActions"
      :query-params="queryParams"
      :pagination="{ pageSize: 20, pageSizes: [10, 20, 50, 100] }"
      perm-prefix="sys:log"
      @delete="handleDelete"
      @selection-change="handleSelectionChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { message } from 'ant-design-vue';
import { $t } from '@vben/locales';
import { LcTable, LcSearchBar } from '#/components/lc';
import { sysLogApi, LogTypeEnum, LogTypeMap } from '#/api/sys/log';
import type { LcTableColumn, LcTableAction, LcSearchField } from '#/components/lc';
import type { LcCrudApi } from '#/components/lc/types';
import type { SysLogResult } from '#/api/sys/log';

// Refs
const tableRef = ref();
const searchBarRef = ref();

// 查询参数
const queryParams = ref<Record<string, any>>({});

// 日志 API
const logApi: LcCrudApi<SysLogResult> = sysLogApi as any;

// 表格列配置
const tableColumns: LcTableColumn[] = [
  { field: 'log_title', title: $t('page.system.log.logTitle'), minWidth: 150 },
  {
    field: 'log_type',
    title: $t('page.system.log.logType'),
    width: 100,
    formatter: (row: SysLogResult) => LogTypeMap[row.log_type] || row.log_type,
  },
  { field: 'business_type', title: $t('page.system.log.businessType'), width: 100 },
  { field: 'request_method', title: $t('page.system.log.requestMethod'), width: 100, align: 'center' },
  { field: 'user_name', title: $t('page.system.log.operator'), width: 120 },
  { field: 'ip', title: $t('page.system.log.operatorIp'), width: 140 },
  { field: 'location', title: $t('page.system.log.operatorLocation'), minWidth: 150 },
  {
    field: 'request_time',
    title: $t('page.system.log.requestTime'),
    width: 100,
    align: 'right',
    formatter: (row: SysLogResult) => row.request_time ? `${row.request_time}ms` : '-',
  },
  { field: 'create_time', title: $t('page.system.log.createTime'), minWidth: 180 },
];

// 表格操作按钮（只读日志，不提供编辑）
const tableActions: LcTableAction[] = [
  { key: 'view', label: $t('page.system.log.detail'), perm: 'query' },
  { key: 'delete', label: $t('page.system.log.delete'), perm: 'delete', danger: true },
];

// 搜索字段配置
const searchFields: LcSearchField[] = [
  {
    fieldCode: 'log_title',
    fieldName: $t('page.system.log.searchLogTitle'),
    fieldType: 'string',
  },
  {
    fieldCode: 'log_type',
    fieldName: $t('page.system.log.searchLogType'),
    fieldType: 'select',
    options: Object.entries(LogTypeMap).map(([value, label]) => ({ label, value })),
  },
  {
    fieldCode: 'user_name',
    fieldName: $t('page.system.log.searchOperator'),
    fieldType: 'string',
  },
  {
    fieldCode: 'dateRange',
    fieldName: $t('page.system.log.searchDateRange'),
    fieldType: 'datetime',
  },
];

// 查询
function handleSearch(values: Record<string, any>) {
  // 处理日期范围
  const params: Record<string, any> = { ...values };
  if (values.dateRange && Array.isArray(values.dateRange)) {
    params.beginTime = values.dateRange[0];
    params.endTime = values.dateRange[1];
    delete params.dateRange;
  }
  queryParams.value = params;
  tableRef.value?.query();
}

// 重置
function handleReset() {
  queryParams.value = {};
  tableRef.value?.query();
}

// 删除
async function handleDelete(row: SysLogResult) {
  console.log('删除日志:', row);
}

// 选中变化
function handleSelectionChange(rows: SysLogResult[]) {
  console.log('选中行:', rows);
}
</script>

<style scoped>
.sys-log-page {
  padding: 16px;
}
</style>
