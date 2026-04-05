<template>
  <Page auto-content-height>
    <div class="p-4">
      <!-- 低代码搜索栏 -->
      <LcSearchBar
        ref="searchBarRef"
        :fields="searchFields"
        :columns="4"
        @search="handleSearch"
        @reset="handleReset"
      />

      <!-- 工具栏 -->
      <div class="mb-4 flex gap-2">
        <Button
          v-access:code="'system:meta:table:manage'"
          type="primary"
          @click="handleAdd"
        >
          <IconifyIcon icon="material-symbols:add" class="mr-1" />
          {{ $t('page.common.add') }}
        </Button>
        <Popconfirm
          title="是否确认批量删除?"
          ok-text="确认"
          cancel-text="取消"
          @confirm="handleBatchDelete"
        >
          <Button
            v-access:code="'system:meta:table:manage'"
            danger
            :disabled="selectedRows.length === 0"
          >
            <IconifyIcon icon="material-symbols:delete" class="mr-1" />
            {{ $t('page.common.batchDelete') }}
          </Button>
        </Popconfirm>
      </div>

      <!-- 低代码表格 -->
      <LcTable
        ref="tableRef"
        :columns="tableColumns"
        :api="tableApi"
        :actions="tableActions"
        :query-params="queryParams"
        perm-prefix="system:meta:table"
        @edit="handleEdit"
        @delete="handleDelete"
        @selection-change="handleSelectionChange"
        @status-change="handleStatusChange"
      />

      <!-- 低代码表单弹窗 -->
      <LcForm
        ref="formRef"
        :fields="formFields"
        :api="formApi"
        mode="modal"
        :width="700"
        @success="handleFormSuccess"
      />
    </div>
  </Page>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { Button, Popconfirm, message } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';

// 低代码组件
import LcSearchBar from '#/components/lc/LcSearchBar.vue';
import LcTable from '#/components/lc/LcTable.vue';
import LcForm from '#/components/lc/LcForm.vue';
import type { LcFormField, LcTableColumn, LcTableAction } from '#/components/lc/types';

// API
import {
  getTableMetaList,
  getTableMetaById,
  addTableMeta,
  updateTableMeta,
  deleteTableMeta,
  toggleTableMetaStatus,
  type TableMetaApi,
} from '#/api/system/tableMeta';

// 组件ref
const searchBarRef = ref<InstanceType<typeof LcSearchBar>>();
const tableRef = ref<InstanceType<typeof LcTable>>();
const formRef = ref<InstanceType<typeof LcForm>>();

// 查询参数
const queryParams = reactive<Record<string, any>>({});

// 选中的行
const selectedRows = ref<any[]>([]);

// ==================== 搜索字段配置 ====================
const searchFields = computed<LcFormField[]>(() => [
  {
    fieldCode: 'tableCode',
    fieldName: '表编码',
    fieldType: 'string',
    placeholder: '请输入表编码',
  },
  {
    fieldCode: 'tableName',
    fieldName: '表名称',
    fieldType: 'string',
    placeholder: '请输入表名称',
  },
  {
    fieldCode: 'module',
    fieldName: '所属模块',
    fieldType: 'select',
    placeholder: '请选择所属模块',
    options: [
      { label: '基础', value: 'base' },
      { label: 'WMS', value: 'wms' },
      { label: '系统', value: 'sys' },
    ],
  },
]);

// ==================== 表格列配置 ====================
const tableColumns = computed<LcTableColumn[]>(() => [
  { field: 'tableCode', title: '表编码', width: 150, fixed: 'left' },
  { field: 'tableName', title: '表名称', width: 180 },
  { field: 'module', title: '所属模块', width: 100 },
  { field: 'entityClass', title: '实体类名', width: 200, showOverflow: 'tooltip' },
  { field: 'serviceClass', title: '服务类名', width: 200, showOverflow: 'tooltip' },
  { field: 'permissionCode', title: '权限标识', width: 150 },
  { field: 'pageSize', title: '默认页大小', width: 100, align: 'center' },
  {
    field: 'isTree',
    title: '是否树形',
    width: 90,
    align: 'center',
    formatter: (row: any) => (row.isTree === 1 ? '是' : '否'),
  },
  {
    field: 'status',
    title: '状态',
    width: 80,
    align: 'center',
    slots: 'status',
  },
  { field: 'remark', title: '备注', width: 200, showOverflow: 'tooltip' },
  { field: 'createTime', title: '创建时间', width: 160 },
  { field: 'action', title: '操作', width: 180, fixed: 'right' },
]);

// ==================== 表格操作按钮配置 ====================
const tableActions = computed<LcTableAction[]>(() => [
  {
    key: 'edit',
    label: $t('page.common.edit'),
    perm: 'manage',
  },
  {
    key: 'delete',
    label: $t('page.common.delete'),
    danger: true,
    perm: 'manage',
  },
]);

// ==================== 表单字段配置 ====================
const formFields = computed<LcFormField[]>(() => [
  {
    fieldCode: 'tableCode',
    fieldName: '表编码',
    fieldType: 'string',
    required: true,
    maxLength: 100,
    placeholder: '请输入表编码，如：sys_user',
  },
  {
    fieldCode: 'tableName',
    fieldName: '表名称',
    fieldType: 'string',
    required: true,
    maxLength: 200,
    placeholder: '请输入表名称',
  },
  {
    fieldCode: 'module',
    fieldName: '所属模块',
    fieldType: 'select',
    required: true,
    options: [
      { label: '基础', value: 'base' },
      { label: 'WMS', value: 'wms' },
      { label: '系统', value: 'sys' },
    ],
    placeholder: '请选择所属模块',
  },
  {
    fieldCode: 'entityClass',
    fieldName: '实体类名',
    fieldType: 'string',
    maxLength: 200,
    placeholder: '请输入实体类完整路径',
  },
  {
    fieldCode: 'serviceClass',
    fieldName: '服务类名',
    fieldType: 'string',
    maxLength: 200,
    placeholder: '请输入服务类完整路径',
  },
  {
    fieldCode: 'permissionCode',
    fieldName: '权限标识',
    fieldType: 'string',
    maxLength: 100,
    placeholder: '请输入权限标识',
  },
  {
    fieldCode: 'pageSize',
    fieldName: '默认页大小',
    fieldType: 'number',
    defaultValue: 20,
    placeholder: '请输入默认页大小',
  },
  {
    fieldCode: 'isTree',
    fieldName: '是否树形',
    fieldType: 'boolean',
    defaultValue: 0,
  },
  {
    fieldCode: 'status',
    fieldName: '状态',
    fieldType: 'boolean',
    defaultValue: 1,
  },
  {
    fieldCode: 'remark',
    fieldName: '备注',
    fieldType: 'textarea',
    maxLength: 500,
    placeholder: '请输入备注',
  },
]);

// ==================== API配置 ====================
const tableApi = {
  page: getTableMetaList,
  delete: deleteTableMeta,
  edit: async (data: TableMetaApi.TableMeta & { id: number }) => {
    // 如果只是状态变更，调用toggle接口
    if (data.status !== undefined) {
      return toggleTableMetaStatus(data.id);
    }
    // 否则调用更新接口
    return updateTableMeta(data.id, data);
  },
};

const formApi = {
  get: getTableMetaById,
  add: addTableMeta,
  edit: (data: TableMetaApi.TableMeta & { id: number }) =>
    updateTableMeta(data.id, data),
};

// ==================== 事件处理 ====================

// 搜索
function handleSearch(values: Record<string, any>) {
  Object.assign(queryParams, values);
  tableRef.value?.reload();
}

// 重置
function handleReset() {
  Object.keys(queryParams).forEach((key) => delete queryParams[key]);
  tableRef.value?.reload();
}

// 新增
function handleAdd() {
  formRef.value?.openAdd();
}

// 编辑
function handleEdit(row: TableMetaApi.TableMeta) {
  formRef.value?.openEdit(row);
}

// 删除
async function handleDelete(row: TableMetaApi.TableMeta) {
  if (!row.id) return;
  try {
    await deleteTableMeta(row.id);
    message.success($t('page.common.deleteSuccess'));
    tableRef.value?.reload();
  } catch (error: any) {
    message.error(error.message || $t('page.common.deleteFailed'));
  }
}

// 批量删除
async function handleBatchDelete() {
  if (selectedRows.value.length === 0) {
    message.warning('请选择要删除的数据');
    return;
  }
  try {
    for (const row of selectedRows.value) {
      if (row.id) {
        await deleteTableMeta(row.id);
      }
    }
    message.success($t('page.common.batchDeleteSuccess'));
    selectedRows.value = [];
    tableRef.value?.reload();
  } catch (error: any) {
    message.error(error.message || $t('page.common.deleteFailed'));
  }
}

// 选中行变化
function handleSelectionChange(rows: any[]) {
  selectedRows.value = rows;
}

// 表单提交成功
function handleFormSuccess() {
  tableRef.value?.reload();
}

// 启用/禁用状态切换
async function handleStatusChange(row: TableMetaApi.TableMeta) {
  if (!row.id) return;
  try {
    await toggleTableMetaStatus(row.id);
    message.success(
      row.status === 1
        ? $t('page.common.disableSuccess')
        : $t('page.common.enableSuccess'),
    );
    tableRef.value?.reload();
  } catch (error: any) {
    message.error(error.message || $t('page.common.statusChangeFailed'));
    // 刷新表格恢复原始状态
    tableRef.value?.reload();
  }
}
</script>
