<template>
  <WmsPageLayout>
    <template #filter>
      <Card :bordered="false">
        <div class="toolbar-row">
          <div class="left-tools">
            <Select
              v-model:value="selectedTableCode"
              placeholder="请选择表编码"
              :loading="tableLoading"
              style="width: 320px"
              show-search
              :filter-option="filterTableOption"
              @change="loadData"
            >
              <SelectOption v-for="table in tableList" :key="table.tableCode" :value="table.tableCode">
                {{ table.tableCode }} - {{ table.tableName }}
              </SelectOption>
            </Select>

            <Input.Search
              v-model:value="searchKeyword"
              placeholder="搜索操作编码 / 名称"
              allow-clear
              style="width: 260px"
              @search="applySearch"
            />
          </div>

          <div class="right-tools">
            <Button type="primary" :disabled="!selectedTableCode" @click="handleAdd">新增操作</Button>
            <Button :disabled="!selectedTableCode" @click="handleSaveSort">保存排序</Button>
            <Popconfirm
              v-if="selectedRowKeys.length"
              title="确认删除选中的操作吗？"
              ok-text="确认"
              cancel-text="取消"
              @confirm="handleBatchDelete"
            >
              <Button danger>批量删除</Button>
            </Popconfirm>
          </div>
        </div>
      </Card>
    </template>

    <WmsDataTable
      :columns="columns"
      :data-source="tableData"
      :loading="loading"
      :pagination="false"
      :row-selection="rowSelection"
      row-key="id"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'seq'">
          {{ index + 1 }}
        </template>
        <template v-else-if="column.key === 'eventConfig'">
          <Tooltip :title="record.eventConfig || '-'">
            <span class="ellipsis">{{ record.eventConfig || '-' }}</span>
          </Tooltip>
        </template>
        <template v-else-if="column.key === 'status'">
          <Tag :color="record.status === 1 ? 'success' : 'default'">
            {{ record.status === 1 ? '启用' : '停用' }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'sortOrder'">
          <InputNumber
            v-model:value="record.sortOrder"
            :min="1"
            :max="9999"
            size="small"
            style="width: 88px"
          />
        </template>
        <template v-else-if="column.key === 'action'">
          <Space>
            <Button type="link" size="small" @click="handleEdit(record)">编辑</Button>
            <Popconfirm
              title="确认删除该操作吗？"
              ok-text="确认"
              cancel-text="取消"
              @confirm="handleDelete(record)"
            >
              <Button type="link" size="small" danger>删除</Button>
            </Popconfirm>
          </Space>
        </template>
      </template>
    </WmsDataTable>

    <OperationMetaModal
      v-model:visible="modalVisible"
      :mode="modalMode"
      :data="currentRecord"
      :table-code="selectedTableCode"
      @success="handleModalSuccess"
    />
  </WmsPageLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  Button,
  Card,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  SelectOption,
  Space,
  Tag,
  Tooltip,
  message,
} from 'ant-design-vue';
import type { TableColumnsType } from 'ant-design-vue';

import { WmsDataTable, WmsPageLayout } from '#/components/wms';
import { getTableMetaListForSelect } from '#/api/system/columnMeta';
import {
  batchDeleteOperationMeta,
  batchSortOperationMeta,
  deleteOperationMeta,
  getOperationMetaList,
  type OperationMetaApi,
} from '#/api/system/operationMeta';

import OperationMetaModal from './modules/operation-meta-modal.vue';

const loading = ref(false);
const tableLoading = ref(false);
const searchKeyword = ref('');
const selectedTableCode = ref<string>('');
const tableList = ref<Array<{ id: number; tableCode: string; tableName: string }>>([]);
const tableData = ref<OperationMetaApi.OperationMeta[]>([]);
const selectedRowKeys = ref<Array<number | string>>([]);

const modalVisible = ref(false);
const modalMode = ref<'add' | 'edit'>('add');
const currentRecord = ref<OperationMetaApi.OperationMeta | null>(null);

const columns = computed<TableColumnsType<OperationMetaApi.OperationMeta>>(() => [
  { title: '序号', key: 'seq', width: 70, align: 'center' },
  { title: '操作编码', dataIndex: 'operationCode', key: 'operationCode', width: 140 },
  { title: '操作名称', dataIndex: 'operationName', key: 'operationName', width: 140 },
  { title: '按钮类型', dataIndex: 'operationType', key: 'operationType', width: 100, align: 'center' },
  { title: '位置', dataIndex: 'position', key: 'position', width: 100, align: 'center' },
  { title: '事件类型', dataIndex: 'eventType', key: 'eventType', width: 110, align: 'center' },
  { title: '事件配置', key: 'eventConfig', width: 260 },
  { title: '排序', key: 'sortOrder', width: 100, align: 'center' },
  { title: '状态', key: 'status', width: 80, align: 'center' },
  { title: '操作', key: 'action', width: 120, align: 'center', fixed: 'right' },
]);

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: Array<number | string>) => {
    selectedRowKeys.value = keys;
  },
}));

function filterTableOption(input: string, option: any) {
  const text = option.children?.() || option.children || '';
  return String(text).toLowerCase().includes(input.toLowerCase());
}

function applySearch() {
  const keyword = searchKeyword.value.trim().toLowerCase();
  if (!keyword) {
    loadData();
    return;
  }
  tableData.value = tableData.value.filter((item) => {
    return (
      item.operationCode?.toLowerCase().includes(keyword) ||
      item.operationName?.toLowerCase().includes(keyword)
    );
  });
}

async function loadTableList() {
  tableLoading.value = true;
  try {
    tableList.value = await getTableMetaListForSelect();
    if (!selectedTableCode.value && tableList.value.length > 0) {
      selectedTableCode.value = tableList.value[0]!.tableCode;
    }
  } catch (error: any) {
    message.error(error?.message || '加载表列表失败');
  } finally {
    tableLoading.value = false;
  }
}

async function loadData() {
  if (!selectedTableCode.value) {
    tableData.value = [];
    return;
  }
  loading.value = true;
  try {
    const res = await getOperationMetaList(selectedTableCode.value);
    tableData.value = (res.rows || []).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    selectedRowKeys.value = [];

    if (searchKeyword.value.trim()) {
      applySearch();
    }
  } catch (error: any) {
    message.error(error?.message || '加载操作元数据失败');
    tableData.value = [];
  } finally {
    loading.value = false;
  }
}

function handleAdd() {
  if (!selectedTableCode.value) {
    message.warning('请先选择表编码');
    return;
  }
  modalMode.value = 'add';
  currentRecord.value = null;
  modalVisible.value = true;
}

function handleEdit(record: OperationMetaApi.OperationMeta) {
  modalMode.value = 'edit';
  currentRecord.value = record;
  modalVisible.value = true;
}

async function handleDelete(record: OperationMetaApi.OperationMeta) {
  if (!record.id) return;
  try {
    await deleteOperationMeta(record.id);
    message.success('删除成功');
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '删除失败');
  }
}

async function handleBatchDelete() {
  if (!selectedRowKeys.value.length) return;
  try {
    await batchDeleteOperationMeta(selectedRowKeys.value.map((id) => Number(id)));
    message.success('批量删除成功');
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '批量删除失败');
  }
}

async function handleSaveSort() {
  const payload = tableData.value
    .filter((item) => item.id)
    .map((item) => ({ id: item.id, sortOrder: Number(item.sortOrder || 0) }));

  try {
    await batchSortOperationMeta(payload as Array<{ id: number; sortOrder: number }>);
    message.success('排序已保存');
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '排序保存失败');
  }
}

function handleModalSuccess() {
  loadData();
}

onMounted(async () => {
  await loadTableList();
  await loadData();
});
</script>

<style scoped>
.toolbar-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.left-tools {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.right-tools {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.ellipsis {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
