<template>
  <LowcodePage
    ref="lowcodePageRef"
    table-code="sys_table_meta"
    page-title="表元数据"
    page-desc="管理低代码表元数据配置"
    crud-prefix="/api/wms/crud/sys_table_meta"
  >
    <template #toolbarExtra>
      <Button type="primary" :loading="exporting" @click="handleExport">
        <template #icon><Download /></template>
        导出
      </Button>
      <Button type="primary" @click="handleAdd">
        <template #icon><Plus /></template>
        新增
      </Button>
    </template>
    <template #appendAction="{ record }">
      <Button type="link" size="small" @click="handleEdit(record)">编辑</Button>
      <Popconfirm
        title="确定删除该条表元数据？"
        ok-text="确定"
        cancel-text="取消"
        @confirm="handleDelete(record)"
      >
        <Button type="link" size="small" danger>删除</Button>
      </Popconfirm>
    </template>
  </LowcodePage>

  <TableMetaModal
    v-model:visible="modalVisible"
    :mode="modalMode"
    :data="currentRecord"
    @success="handleModalSuccess"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Button, Popconfirm, message } from 'ant-design-vue';
import { Download, Plus } from 'lucide-vue-next';
import LowcodePage from '#/lowcode/LowcodePage.vue';

import {
  deleteTableMeta,
  exportTableMeta,
  type TableMetaResult,
} from '#/api/system/tableMeta';
import TableMetaModal from './modules/table-meta-modal.vue';

const lowcodePageRef = ref<InstanceType<typeof LowcodePage> | null>(null);

const modalVisible = ref(false);
const modalMode = ref<'add' | 'edit'>('add');
const currentRecord = ref<TableMetaResult | null>(null);
const exporting = ref(false);

function handleAdd() {
  modalMode.value = 'add';
  currentRecord.value = null;
  modalVisible.value = true;
}

function handleEdit(record: TableMetaResult) {
  modalMode.value = 'edit';
  currentRecord.value = record;
  modalVisible.value = true;
}

async function handleDelete(record: TableMetaResult) {
  if (!record.id) return;
  try {
    await deleteTableMeta(record.id);
    message.success('删除成功');
    lowcodePageRef.value?.reload();
  } catch (error: any) {
    message.error(error?.message || '删除失败');
  }
}

async function handleExport() {
  exporting.value = true;
  try {
    // 从低代码搜索表单中提取查询参数
    const searchForm = lowcodePageRef.value?.searchForm || {};
    const params = {
      tableCode: searchForm.tableCode || undefined,
      tableName: searchForm.tableName || undefined,
      module: searchForm.module || undefined,
      pageType: searchForm.pageType || undefined,
    };
    const blob = await exportTableMeta(params);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `table_meta_${Date.now()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    message.success('导出成功');
  } catch (error: any) {
    message.error(error?.message || '导出失败');
  } finally {
    exporting.value = false;
  }
}

function handleModalSuccess() {
  lowcodePageRef.value?.reload();
}
</script>
