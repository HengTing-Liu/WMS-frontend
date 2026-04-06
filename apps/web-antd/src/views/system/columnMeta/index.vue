<template>
  <WmsPageLayout
    title="字段元数据管理"
    description="管理表字段的配置信息，支持拖拽排序和批量操作"
  >
    <template #filter>
      <Card :bordered="false" class="filter-card">
        <div class="filter-row">
          <!-- 表选择 -->
          <div class="filter-item">
            <span class="filter-label">所属表：</span>
            <Select
              v-model:value="selectedTableId"
              :loading="tableLoading"
              placeholder="请选择表"
              style="width: 280px"
              show-search
              :filter-option="filterTableOption"
              @change="handleTableChange"
            >
              <Select.Option v-for="table in tableList" :key="table.id" :value="table.id">
                {{ table.tableCode }} - {{ table.tableName }}
              </Select.Option>
            </Select>
          </div>

          <!-- 快速搜索 -->
          <div class="filter-item search-item">
            <Input.Search
              v-model:value="searchKeyword"
              placeholder="搜索字段编码/名称"
              allow-clear
              @search="handleSearch"
              @press-enter="handleSearch"
            />
          </div>

          <!-- 操作按钮 -->
          <div class="filter-actions">
            <Button type="primary" :disabled="!selectedTableId" @click="handleAdd">
              <Plus class="btn-icon" /> 新增字段
            </Button>
            <Button :disabled="!selectedTableId" @click="handleBatchAdd">
              <Copy class="btn-icon" /> 批量新增
            </Button>
            <Button :disabled="!selectedTableId" @click="handleCopyFrom">
              <Copy class="btn-icon" /> 从其他表复制
            </Button>
            <Popconfirm
              v-if="selectedRowKeys.length > 0"
              title="确定删除选中的字段吗？"
              ok-text="确认"
              cancel-text="取消"
              @confirm="handleBatchDelete"
            >
              <Button danger>
                <Trash2 class="btn-icon" /> 批量删除
              </Button>
            </Popconfirm>
          </div>
        </div>
      </Card>
    </template>

    <!-- 拖拽排序提示 -->
    <Alert
      v-if="selectedTableId"
      type="info"
      show-icon
      class="sort-hint"
    >
      <template #message>
        提示：拖拽表格行可调整字段顺序，调整后会自动保存排序
      </template>
    </Alert>

    <!-- 数据表格 -->
    <WmsDataTable
      :columns="columns"
      :data-source="tableData"
      :loading="loading"
      :pagination="false"
      :row-selection="rowSelection"
      row-key="id"
      class="drag-table"
    >
      <template #bodyCell="{ column, record, index }">
        <!-- 序号 -->
        <template v-if="column.key === 'seq'">
          <div class="seq-cell">
            <IconifyIcon icon="material-symbols:drag-indicator" class="drag-icon" />
            <span>{{ index + 1 }}</span>
          </div>
        </template>

        <!-- 字段类型 -->
        <template v-else-if="column.key === 'fieldType'">
          <Tag :color="getFieldTypeColor(record.fieldType)">
            {{ getFieldTypeLabel(record.fieldType) }}
          </Tag>
        </template>

        <!-- 数据类型 -->
        <template v-else-if="column.key === 'dataType'">
          <Tag :color="getDataTypeColor(record.dataType)">
            {{ record.dataType }}
          </Tag>
        </template>

        <!-- 是否必填 -->
        <template v-else-if="column.key === 'isRequired'">
          <Switch
            :checked="record.isRequired === 1"
            size="small"
            @change="(checked: boolean) => handleToggleRequired(record, checked)"
          />
        </template>

        <!-- 列表显示 -->
        <template v-else-if="column.key === 'isShowInList'">
          <Switch
            :checked="record.isShowInList === 1"
            size="small"
            @change="(checked: boolean) => handleToggleShowInList(record, checked)"
          />
        </template>

        <!-- 表单显示 -->
        <template v-else-if="column.key === 'isShowInForm'">
          <Switch
            :checked="record.isShowInForm === 1"
            size="small"
            @change="(checked: boolean) => handleToggleShowInForm(record, checked)"
          />
        </template>

        <!-- 状态 -->
        <template v-else-if="column.key === 'isEnabled'">
          <Switch
            :checked="record.isEnabled === 1"
            size="small"
            @change="(checked: boolean) => handleToggleStatus(record, checked)"
          />
        </template>

        <!-- 操作列 -->
        <template v-else-if="column.key === 'action'">
          <Space>
            <Tooltip title="编辑">
              <Button type="link" size="small" class="action-btn" @click="handleEdit(record)">
                <IconifyIcon icon="material-symbols:edit" />
              </Button>
            </Tooltip>
            <Tooltip title="删除">
              <Popconfirm
                title="确定删除该字段吗？"
                ok-text="确认"
                cancel-text="取消"
                @confirm="handleDelete(record)"
              >
                <Button type="link" size="small" danger class="action-btn">
                  <IconifyIcon icon="material-symbols:delete" />
                </Button>
              </Popconfirm>
            </Tooltip>
          </Space>
        </template>
      </template>
    </WmsDataTable>

    <!-- 空状态 -->
    <div v-if="!selectedTableId" class="empty-state">
      <IconifyIcon icon="material-symbols:table" class="empty-icon" />
      <p>请先选择一个表</p>
    </div>

    <!-- 编辑弹窗 -->
    <ColumnMetaModal
      v-model:visible="modalVisible"
      :mode="modalMode"
      :data="currentRecord"
      :table-id="selectedTableId"
      @success="handleModalSuccess"
    />

    <!-- 批量新增弹窗 -->
    <BatchAddModal
      v-model:visible="batchModalVisible"
      :table-id="selectedTableId"
      @success="handleModalSuccess"
    />

    <!-- 从其他表复制弹窗 -->
    <CopyFromModal
      v-model:visible="copyModalVisible"
      :table-id="selectedTableId"
      :table-list="tableList"
      @success="handleModalSuccess"
    />
  </WmsPageLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import {
  Alert,
  Button,
  Card,
  Input,
  Popconfirm,
  Select,
  SelectOption,
  Space,
  Switch,
  Tag,
  Tooltip,
  message,
} from 'ant-design-vue';
import { Plus, Copy, Trash2 } from 'lucide-vue-next';
import type { TableColumnsType } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { WmsDataTable, WmsPageLayout } from '#/components/wms';
import ColumnMetaModal from './modules/column-meta-modal.vue';
import BatchAddModal from './modules/batch-add-modal.vue';
import CopyFromModal from './modules/copy-from-modal.vue';
import {
  getColumnMetaList,
  deleteColumnMeta,
  updateColumnMeta,
  batchUpdateSortOrder,
  getTableMetaListForSelect,
  type ColumnMetaApi,
} from '#/api/system/columnMeta';
import { useSortable } from '@vben/hooks';

// ========== 状态 ==========
const loading = ref(false);
const tableLoading = ref(false);
const tableData = ref<ColumnMetaApi.ColumnMeta[]>([]);
const selectedRowKeys = ref<Array<number | string>>([]);
const selectedTableId = ref<number | undefined>(undefined);
const tableList = ref<{ id: number; tableCode: string; tableName: string }[]>([]);
const searchKeyword = ref('');

// 弹窗状态
const modalVisible = ref(false);
const batchModalVisible = ref(false);
const copyModalVisible = ref(false);
const modalMode = ref<'add' | 'edit'>('add');
const currentRecord = ref<ColumnMetaApi.ColumnMeta | null>(null);

// ========== 表格列定义 ==========
const columns = computed<TableColumnsType>(() => [
  { title: '排序', key: 'seq', width: 70, align: 'center' },
  { title: '字段编码', dataIndex: 'columnCode', key: 'columnCode', width: 150 },
  { title: '字段名称', dataIndex: 'columnName', key: 'columnName', width: 150 },
  { title: '字段类型', key: 'fieldType', width: 120, align: 'center' },
  { title: '数据类型', key: 'dataType', width: 100, align: 'center' },
  { title: '必填', key: 'isRequired', width: 70, align: 'center' },
  { title: '列表显示', key: 'isShowInList', width: 90, align: 'center' },
  { title: '表单显示', key: 'isShowInForm', width: 90, align: 'center' },
  { title: '排序号', dataIndex: 'sortOrder', key: 'sortOrder', width: 80, align: 'center' },
  { title: '状态', key: 'isEnabled', width: 70, align: 'center' },
  { title: '操作', key: 'action', width: 120, align: 'center', fixed: 'right' },
]);

// 行选择配置
const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: Array<number | string>) => {
    selectedRowKeys.value = keys;
  },
}));

// ========== 加载数据 ==========
async function loadTableList() {
  tableLoading.value = true;
  try {
    const res = await getTableMetaListForSelect();
    tableList.value = res;
  } catch (error: any) {
    message.error(error?.message || '加载表列表失败');
  } finally {
    tableLoading.value = false;
  }
}

async function loadData() {
  if (!selectedTableId.value) {
    tableData.value = [];
    return;
  }

  loading.value = true;
  try {
    const res = await getColumnMetaList({
      tableId: selectedTableId.value,
      pageNum: 1,
      pageSize: 1000,
    });

    // 按 sortOrder 排序
    let rows = res.rows || [];
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase();
      rows = rows.filter(
        (item) =>
          item.columnCode.toLowerCase().includes(keyword) ||
          item.columnName.toLowerCase().includes(keyword)
      );
    }
    tableData.value = rows.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    selectedRowKeys.value = [];
  } catch (error: any) {
    message.error(error?.message || '加载字段列表失败');
    tableData.value = [];
  } finally {
    loading.value = false;
  }
}

// ========== 事件处理 ==========
function handleTableChange(value: number) {
  selectedTableId.value = value;
  searchKeyword.value = '';
  loadData();
}

function filterTableOption(input: string, option: any) {
  const text = option.children?.() || option.children || '';
  return String(text).toLowerCase().includes(input.toLowerCase());
}

function handleSearch() {
  loadData();
}

function handleAdd() {
  if (!selectedTableId.value) {
    message.warning('请先选择表');
    return;
  }
  modalMode.value = 'add';
  currentRecord.value = null;
  modalVisible.value = true;
}

function handleEdit(record: ColumnMetaApi.ColumnMeta) {
  modalMode.value = 'edit';
  currentRecord.value = record;
  modalVisible.value = true;
}

async function handleDelete(record: ColumnMetaApi.ColumnMeta) {
  if (!record.id) return;
  try {
    await deleteColumnMeta(record.id);
    message.success('删除成功');
    selectedRowKeys.value = selectedRowKeys.value.filter((key) => key !== record.id);
    loadData();
  } catch (error: any) {
    message.error(error?.message || '删除失败');
  }
}

async function handleBatchDelete() {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择要删除的字段');
    return;
  }
  try {
    for (const id of selectedRowKeys.value) {
      await deleteColumnMeta(Number(id));
    }
    message.success('批量删除成功');
    selectedRowKeys.value = [];
    loadData();
  } catch (error: any) {
    message.error(error?.message || '批量删除失败');
  }
}

function handleBatchAdd() {
  if (!selectedTableId.value) {
    message.warning('请先选择表');
    return;
  }
  batchModalVisible.value = true;
}

function handleCopyFrom() {
  if (!selectedTableId.value) {
    message.warning('请先选择表');
    return;
  }
  copyModalVisible.value = true;
}

function handleModalSuccess() {
  loadData();
}

// ========== 状态切换 ==========
async function handleToggleStatus(record: ColumnMetaApi.ColumnMeta, checked: boolean) {
  try {
    await updateColumnMeta({
      ...record,
      isEnabled: checked ? 1 : 0,
    });
    message.success(checked ? '已启用' : '已停用');
    loadData();
  } catch (error: any) {
    message.error(error?.message || '状态切换失败');
    loadData();
  }
}

async function handleToggleRequired(record: ColumnMetaApi.ColumnMeta, checked: boolean) {
  try {
    await updateColumnMeta({
      ...record,
      isRequired: checked ? 1 : 0,
    });
    message.success(checked ? '已设为必填' : '已取消必填');
    loadData();
  } catch (error: any) {
    message.error(error?.message || '操作失败');
    loadData();
  }
}

async function handleToggleShowInList(record: ColumnMetaApi.ColumnMeta, checked: boolean) {
  try {
    await updateColumnMeta({
      ...record,
      isShowInList: checked ? 1 : 0,
    });
    message.success(checked ? '列表显示已开启' : '列表显示已关闭');
    loadData();
  } catch (error: any) {
    message.error(error?.message || '操作失败');
    loadData();
  }
}

async function handleToggleShowInForm(record: ColumnMetaApi.ColumnMeta, checked: boolean) {
  try {
    await updateColumnMeta({
      ...record,
      isShowInForm: checked ? 1 : 0,
    });
    message.success(checked ? '表单显示已开启' : '表单显示已关闭');
    loadData();
  } catch (error: any) {
    message.error(error?.message || '操作失败');
    loadData();
  }
}

// ========== 拖拽排序 ==========
let sortableInstance: any = null;

async function initSortable() {
  const tbody = document.querySelector('.drag-table .ant-table-tbody') as HTMLElement;
  if (!tbody) return;

  const { initializeSortable } = useSortable(tbody, {
    handle: '.drag-icon',
    animation: 150,
    delay: 0,
    onEnd: async (evt: any) => {
      const { oldIndex, newIndex } = evt;
      if (oldIndex === newIndex || oldIndex === undefined || newIndex === undefined) return;

      // 本地调整顺序
      const movedItem = tableData.value.splice(oldIndex, 1)[0];
      tableData.value.splice(newIndex, 0, movedItem);

      // 重新计算 sortOrder
      const orders = tableData.value.map((item, index) => ({
        id: item.id!,
        sortOrder: index + 1,
      }));

      // 批量更新排序
      try {
        await batchUpdateSortOrder(orders);
        message.success('排序已保存');
        loadData();
      } catch (error: any) {
        message.error(error?.message || '排序保存失败');
        loadData();
      }
    },
  });

  sortableInstance = await initializeSortable();
}

function destroySortable() {
  if (sortableInstance && sortableInstance.destroy) {
    sortableInstance.destroy();
    sortableInstance = null;
  }
}

// ========== 辅助函数 ==========
function getFieldTypeLabel(type: string): string {
  const map: Record<string, string> = {
    text: '文本',
    textarea: '多行文本',
    number: '数字',
    select: '下拉选择',
    switch: '开关',
    date: '日期',
    datetime: '日期时间',
    radio: '单选',
    checkbox: '多选',
  };
  return map[type] || type;
}

function getFieldTypeColor(type: string): string {
  const map: Record<string, string> = {
    text: 'blue',
    textarea: 'cyan',
    number: 'green',
    select: 'purple',
    switch: 'orange',
    date: 'magenta',
    datetime: 'red',
    radio: 'gold',
    checkbox: 'lime',
  };
  return map[type] || 'default';
}

function getDataTypeColor(type: string): string {
  const map: Record<string, string> = {
    string: 'blue',
    int: 'green',
    decimal: 'orange',
    datetime: 'purple',
  };
  return map[type] || 'default';
}

// ========== 生命周期 ==========
onMounted(() => {
  loadTableList();
  nextTick(() => {
    initSortable();
  });
});
</script>

<style scoped>
.filter-card {
  margin-bottom: 0;
}

.filter-card :deep(.ant-card-body) {
  padding: 16px;
}

.filter-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-weight: 500;
  color: #374151;
}

.search-item {
  flex: 1;
  min-width: 200px;
  max-width: 300px;
}

.filter-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.sort-hint {
  margin-bottom: 0;
}

.seq-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.drag-icon {
  cursor: move;
  color: #9ca3af;
  font-size: 18px;
}

.drag-icon:hover {
  color: #6b7280;
}

.action-btn {
  padding: 0 4px;
  font-size: 18px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: #9ca3af;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.drag-table :deep(.ant-table-tbody > tr) {
  cursor: default;
}

.drag-table :deep(.ant-table-tbody > tr.sortable-ghost) {
  background: #e6f7ff;
  opacity: 0.5;
}

.drag-table :deep(.ant-table-tbody > tr.sortable-drag) {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
</style>
