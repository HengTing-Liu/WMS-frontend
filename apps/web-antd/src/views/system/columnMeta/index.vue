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
              v-model:value="selectedTableCode"
              :loading="tableLoading"
              placeholder="请选择表"
              style="width: 280px"
              show-search
              option-filter-prop="label"
              @change="(value) => handleTableChange(value as string | number | undefined)"
            >
              <Select.Option
                v-for="table in tableList"
                :key="table.tableCode"
                :value="table.tableCode"
                :label="`${table.tableCode} - ${table.tableName}`"
              >
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
            <Button type="primary" :disabled="!selectedTableCode" @click="handleAdd">
              <Plus class="btn-icon" /> 新增字段
            </Button>
            <Button :disabled="!selectedTableCode" @click="handleOpenLookupWizard">
              <IconifyIcon icon="material-symbols:table-view" class="btn-icon" />
              批量添加关联字段
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
            <Button
              v-if="selectedRowKeys.length > 0"
              type="primary"
              ghost
              @click="handleBatchSetGroup"
            >
              <IconifyIcon icon="material-symbols:folder-managed" class="btn-icon" />
              批量设置分组
            </Button>
            <Button
              v-if="selectedRowKeys.length > 0"
              type="primary"
              ghost
              @click="handleBatchSetColspan"
            >
              <IconifyIcon icon="material-symbols:view-column" class="btn-icon" />
              批量设置列宽
            </Button>
          </div>
        </div>
      </Card>
    </template>

    <!-- 拖拽排序提示 -->
    <Alert
      v-if="selectedTableCode"
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
        <template v-else-if="column.key === 'formType'">
          <Tag :color="getFieldTypeColor(record.formType)">
            {{ getFieldTypeLabel(record.formType) }}
          </Tag>
        </template>

        <!-- 数据类型 -->
        <template v-else-if="column.key === 'dataType'">
          <Tag :color="getDataTypeColor(record.dataType)">
            {{ record.dataType }}
          </Tag>
        </template>

        <!-- 栅格列宽：未配置时接口为 colSpan null，与弹窗一致显示为 — -->
        <template v-else-if="column.key === 'colSpan'">
          <span v-if="record.colSpan === undefined || record.colSpan === null">—</span>
          <span v-else>{{ record.colSpan }}</span>
        </template>

        <template v-else-if="column.key === 'sectionType'">
          <Tag :color="record.sectionType === 'collapse' ? 'geekblue' : 'default'">
            {{ record.sectionType === 'collapse' ? 'Collapse' : 'Card' }}
          </Tag>
        </template>

        <template v-else-if="column.key === 'sectionOpen'">
          <Tag :color="Number(record.sectionOpen ?? 1) === 1 ? 'green' : 'default'">
            {{ Number(record.sectionOpen ?? 1) === 1 ? '是' : '否' }}
          </Tag>
        </template>

        <!-- 是否必填 -->
        <template v-else-if="column.key === 'required'">
          <Switch
            :checked="record.required === 1"
            size="small"
            @change="(checked) => void handleToggleRequired(record, checked as boolean)"
          />
        </template>

        <!-- 只读 -->
        <template v-else-if="column.key === 'readonly'">
          <Switch
            :checked="record.readonly === 1"
            size="small"
            @change="(checked) => void handleToggleReadonly(record, checked as boolean)"
          />
        </template>

        <!-- 编辑时只读 -->
        <template v-else-if="column.key === 'editReadonly'">
          <Switch
            :checked="record.editReadonly === 1"
            size="small"
            @change="(checked) => void handleToggleEditReadonly(record, checked as boolean)"
          />
        </template>

        <!-- 列表显示 -->
        <template v-else-if="column.key === 'showInList'">
          <Switch
            :checked="record.showInList === 1"
            size="small"
            @change="(checked) => void handleToggleShowInList(record, checked as boolean)"
          />
        </template>

        <!-- 表单显示 -->
        <template v-else-if="column.key === 'showInForm'">
          <Switch
            :checked="record.showInForm === 1"
            size="small"
            @change="(checked) => void handleToggleShowInForm(record, checked as boolean)"
          />
        </template>

        <!-- 可搜索 -->
        <template v-else-if="column.key === 'searchable'">
          <Switch
            :checked="record.searchable === 1"
            size="small"
            @change="(checked) => void handleToggleSearchable(record, checked as boolean)"
          />
        </template>

        <!-- 导出显示 -->
        <template v-else-if="column.key === 'showInExport'">
          <Switch
            :checked="record.showInExport === 1"
            size="small"
            @change="(checked) => void handleToggleShowInExport(record, checked as boolean)"
          />
        </template>

        <!-- 导入显示 -->
        <template v-else-if="column.key === 'showInImport'">
          <Switch
            :checked="record.showInImport === 1"
            size="small"
            @change="(checked) => void handleToggleShowInImport(record, checked as boolean)"
          />
        </template>

        <!-- 状态 -->
        <template v-else-if="column.key === 'status'">
          <Switch
            :checked="record.status === 1"
            size="small"
            @change="(checked) => void handleToggleStatus(record, checked as boolean)"
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
    <div v-if="!selectedTableCode" class="empty-state">
      <IconifyIcon icon="material-symbols:table" class="empty-icon" />
      <p>请先选择一个表</p>
    </div>

    <!-- 编辑弹窗 -->
    <ColumnMetaModal
      v-model:visible="modalVisible"
      :mode="modalMode"
      :data="currentRecord"
      :table-code="selectedTableCode"
      @success="handleModalSuccess"
    />
    <BatchSetGroupModal
      v-model:visible="batchSetGroupVisible"
      :table-code="selectedTableCode || ''"
      :selected-ids="selectedRowKeys.map((k) => Number(k))"
      @success="handleModalSuccess"
    />
    <BatchSetColspanModal
      v-model:visible="batchSetColspanVisible"
      :selected-ids="selectedRowKeys.map((k) => Number(k))"
      @success="handleModalSuccess"
    />
    <LookupBatchWizard
      v-model:visible="lookupWizardVisible"
      :table-code="selectedTableCode"
      @success="handleModalSuccess"
    />
  </WmsPageLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch, onActivated, onDeactivated, onBeforeUnmount } from 'vue';
import {
  Alert,
  Button,
  Card,
  Input,
  Popconfirm,
  Select,
  Space,
  Switch,
  Tag,
  Tooltip,
  message,
} from 'ant-design-vue';
import { Plus, Trash2 } from 'lucide-vue-next';
import type { TableColumnsType } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { WmsDataTable, WmsPageLayout } from '#/components/wms';
import ColumnMetaModal from './modules/column-meta-modal.vue';
import BatchSetGroupModal from './modules/batch-set-group-modal.vue';
import BatchSetColspanModal from './modules/batch-set-colspan-modal.vue';
import LookupBatchWizard from './modules/lookup-batch-wizard.vue';
import {
  getColumnMetaList,
  deleteColumnMeta,
  updateColumnMeta,
  batchUpdateSortOrder,
  getTableMetaListForSelect,
  type ColumnMetaApi,
} from '#/api/system/columnMeta';
import { useSortable } from '@vben/hooks';

type ColumnMetaPageState = {
  selectedRowKeys: Array<number | string>;
  selectedTableCode?: string;
  tableData: ColumnMetaApi.ColumnMeta[];
  tableList: { id: number; tableCode: string; tableName: string }[];
  searchKeyword: string;
};

const PAGE_STATE_CACHE_KEY = 'system-column-meta-page-state';
const PAGE_STATE_STORAGE_KEY = `${PAGE_STATE_CACHE_KEY}:session-v1`;
const PAGE_STATE_NON_EMPTY_STORAGE_KEY = `${PAGE_STATE_CACHE_KEY}:session-non-empty-v1`;
const pageStateCache = new Map<string, ColumnMetaPageState>();
let nonEmptyPageStateCache: ColumnMetaPageState | null = null;
let restoringPageState = false;

// ========== 状态 ==========
const loading = ref(false);
const tableLoading = ref(false);
const tableData = ref<ColumnMetaApi.ColumnMeta[]>([]);
const selectedRowKeys = ref<Array<number | string>>([]);
const selectedTableCode = ref<string | undefined>(undefined);
const tableList = ref<{ id: number; tableCode: string; tableName: string }[]>([]);
const searchKeyword = ref('');

// 弹窗状态
const modalVisible = ref(false);
const modalMode = ref<'add' | 'edit'>('add');
const currentRecord = ref<ColumnMetaApi.ColumnMeta | null>(null);

const batchSetGroupVisible = ref(false);
const batchSetColspanVisible = ref(false);
const lookupWizardVisible = ref(false);

function handleOpenLookupWizard() {
  if (!selectedTableCode.value) {
    message.warning('请先选择表');
    return;
  }
  lookupWizardVisible.value = true;
}

function savePageState() {
  const state: ColumnMetaPageState = {
    selectedRowKeys: [...selectedRowKeys.value],
    selectedTableCode: selectedTableCode.value,
    tableData: [...tableData.value],
    tableList: [...tableList.value],
    searchKeyword: searchKeyword.value,
  };

  // Guard against transient empty snapshots during tab switch.
  if (!state.selectedTableCode && state.tableData.length === 0 && nonEmptyPageStateCache) {
    return;
  }

  pageStateCache.set(PAGE_STATE_CACHE_KEY, state);
  try {
    sessionStorage.setItem(PAGE_STATE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage failures
  }

  if (state.selectedTableCode || state.tableData.length > 0) {
    nonEmptyPageStateCache = state;
    try {
      sessionStorage.setItem(PAGE_STATE_NON_EMPTY_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage failures
    }
  }
}

function restorePageState() {
  let cached = pageStateCache.get(PAGE_STATE_CACHE_KEY);
  if (!cached) {
    try {
      const raw = sessionStorage.getItem(PAGE_STATE_STORAGE_KEY);
      if (raw) {
        cached = JSON.parse(raw) as ColumnMetaPageState;
        pageStateCache.set(PAGE_STATE_CACHE_KEY, cached);
      }
    } catch {
      // ignore parse/storage failures
    }
  }
  if (!cached || (!cached.selectedTableCode && cached.tableData.length === 0)) {
    let fallback = nonEmptyPageStateCache;
    if (!fallback) {
      try {
        const raw = sessionStorage.getItem(PAGE_STATE_NON_EMPTY_STORAGE_KEY);
        if (raw) {
          fallback = JSON.parse(raw) as ColumnMetaPageState;
          nonEmptyPageStateCache = fallback;
        }
      } catch {
        // ignore parse/storage failures
      }
    }
    if (fallback) {
      cached = fallback;
      pageStateCache.set(PAGE_STATE_CACHE_KEY, fallback);
    }
  }
  if (!cached) return false;
  restoringPageState = true;
  selectedRowKeys.value = [...cached.selectedRowKeys];
  selectedTableCode.value = cached.selectedTableCode;
  tableData.value = [...cached.tableData];
  tableList.value = [...cached.tableList];
  searchKeyword.value = cached.searchKeyword;
  restoringPageState = false;
  return true;
}

// ========== 表格列定义 ==========
const columns = computed<TableColumnsType>(() => [
  { title: '排序', key: 'seq', width: 70, align: 'center' },
  { title: '字段编码', dataIndex: 'field', key: 'field', width: 150 },
  { title: '字段名称', dataIndex: 'title', key: 'title', width: 150 },
  { title: '列表宽度', dataIndex: 'width', key: 'width', width: 90, align: 'center' },
  { title: '栅格列宽', dataIndex: 'colSpan', key: 'colSpan', width: 90, align: 'center' },
  { title: '只读', key: 'readonly', width: 70, align: 'center' },
  { title: '编辑只读', key: 'editReadonly', width: 90, align: 'center' },
  { title: '容器', dataIndex: 'sectionType', key: 'sectionType', width: 90, align: 'center' },
  { title: '字段类型', key: 'formType', width: 120, align: 'center' },
  { title: '数据类型', key: 'dataType', width: 100, align: 'center' },
  { title: '必填', key: 'required', width: 70, align: 'center' },
  { title: '可搜索', key: 'searchable', width: 90, align: 'center' },
  { title: '列表显示', key: 'showInList', width: 90, align: 'center' },
  { title: '表单显示', key: 'showInForm', width: 90, align: 'center' },
  { title: '导出显示', key: 'showInExport', width: 90, align: 'center' },
  { title: '导入显示', key: 'showInImport', width: 90, align: 'center' },
  { title: '分组排序', dataIndex: 'sectionOrder', key: 'sectionOrder', width: 90, align: 'center' },
  { title: '默认展开', dataIndex: 'sectionOpen', key: 'sectionOpen', width: 90, align: 'center' },
  { title: '状态', key: 'status', width: 70, align: 'center' },
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
  if (!selectedTableCode.value) {
    // Keep current data when table code is transiently empty during tab switches.
    return;
  }

  loading.value = true;
  try {
    const res = await getColumnMetaList({
      tableCode: selectedTableCode.value,
      pageNum: 1,
      pageSize: 1000,
    });

    // 按 sortOrder 排序
    let rows: ColumnMetaApi.ColumnMeta[] = res.rows || [];
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase();
      rows = rows.filter(
        (item: ColumnMetaApi.ColumnMeta) =>
          (item.field || item.columnCode || '').toLowerCase().includes(keyword) ||
          (item.title || item.columnName || '').toLowerCase().includes(keyword)
      );
    }
    tableData.value = rows.sort(
      (a: ColumnMetaApi.ColumnMeta, b: ColumnMetaApi.ColumnMeta) => (a.sortOrder || 0) - (b.sortOrder || 0),
    );
    selectedRowKeys.value = [];
  } catch (error: any) {
    message.error(error?.message || '加载字段列表失败');
    tableData.value = [];
  } finally {
    loading.value = false;
  }
}

// ========== 事件处理 ==========
function handleTableChange(value?: string | number) {
  // Ignore transient clear events from Select during options/layout updates.
  if (!value) return;
  selectedTableCode.value = String(value);
  searchKeyword.value = '';
}

function handleSearch() {
  loadData();
}

function handleAdd() {
  if (!selectedTableCode.value) {
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

function handleBatchSetGroup() {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请先选择字段');
    return;
  }
  batchSetGroupVisible.value = true;
}

function handleBatchSetColspan() {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请先选择字段');
    return;
  }
  batchSetColspanVisible.value = true;
}

async function handleBatchDelete() {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择要删除的字段');
    return;
  }
  try {
    const results = await Promise.allSettled(
      selectedRowKeys.value.map((id) => deleteColumnMeta(Number(id)))
    );
    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length === 0) {
      message.success('批量删除成功');
    } else {
      message.warning(`批量删除完成，${failures.length} 条失败`);
    }
    selectedRowKeys.value = [];
    loadData();
  } catch (error: any) {
    message.error(error?.message || '批量删除失败');
  }
}

function handleModalSuccess() {
  loadData();
}

// ========== 状态切换 ==========
async function handleToggleStatus(record: ColumnMetaApi.ColumnMeta, checked: boolean) {
  try {
    await updateColumnMeta({
      ...record,
      status: checked ? 1 : 0,
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
      required: checked ? 1 : 0,
    });
    message.success(checked ? '已设为必填' : '已取消必填');
    loadData();
  } catch (error: any) {
    message.error(error?.message || '操作失败');
    loadData();
  }
}

async function handleToggleSearchable(record: ColumnMetaApi.ColumnMeta, checked: boolean) {
  try {
    await updateColumnMeta({
      ...record,
      searchable: checked ? 1 : 0,
    });
    message.success(checked ? '已设为可搜索' : '已取消可搜索');
    loadData();
  } catch (error: any) {
    message.error(error?.message || '操作失败');
    loadData();
  }
}

async function handleToggleReadonly(record: ColumnMetaApi.ColumnMeta, checked: boolean) {
  try {
    await updateColumnMeta({
      ...record,
      readonly: checked ? 1 : 0,
    });
    message.success(checked ? '已设为只读' : '已取消只读');
    loadData();
  } catch (error: any) {
    message.error(error?.message || '操作失败');
    loadData();
  }
}

async function handleToggleEditReadonly(record: ColumnMetaApi.ColumnMeta, checked: boolean) {
  try {
    await updateColumnMeta({
      ...record,
      editReadonly: checked ? 1 : 0,
    });
    message.success(checked ? '已设为编辑时只读' : '已取消编辑时只读');
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
      showInList: checked ? 1 : 0,
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
      showInForm: checked ? 1 : 0,
    });
    message.success(checked ? '表单显示已开启' : '表单显示已关闭');
    loadData();
  } catch (error: any) {
    message.error(error?.message || '操作失败');
    loadData();
  }
}

async function handleToggleShowInExport(record: ColumnMetaApi.ColumnMeta, checked: boolean) {
  try {
    await updateColumnMeta({
      ...record,
      showInExport: checked ? 1 : 0,
    });
    message.success(checked ? '导出显示已开启' : '导出显示已关闭');
    loadData();
  } catch (error: any) {
    message.error(error?.message || '操作失败');
    loadData();
  }
}

async function handleToggleShowInImport(record: ColumnMetaApi.ColumnMeta, checked: boolean) {
  try {
    await updateColumnMeta({
      ...record,
      showInImport: checked ? 1 : 0,
    });
    message.success(checked ? '导入显示已开启' : '导入显示已关闭');
    loadData();
  } catch (error: any) {
    message.error(error?.message || '操作失败');
    loadData();
  }
}

// ========== 拖拽排序 ==========
let sortableInstance: any = null;

async function initSortable() {
  if (searchKeyword.value.trim()) {
    destroySortable();
    return;
  }
  const tbody = document.querySelector('.drag-table .ant-table-tbody') as HTMLElement;
  if (!tbody) return;

  destroySortable();

  const { initializeSortable } = useSortable(tbody, {
    handle: '.drag-icon',
    animation: 150,
    delay: 0,
    onEnd: async (evt: any) => {
      const { oldIndex, newIndex } = evt;
      if (oldIndex === newIndex || oldIndex === undefined || newIndex === undefined) return;
      if (searchKeyword.value.trim()) {
        message.warning('存在搜索条件时不允许拖拽排序，请先清空搜索条件');
        await loadData();
        return;
      }

      // 本地调整顺序
      const movedItem = tableData.value.splice(oldIndex, 1)[0];
      if (!movedItem) {
        await loadData();
        return;
      }
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
onMounted(async () => {
  const restored = restorePageState();
  if (!tableList.value.length) {
    await loadTableList();
  }
  if (
    selectedTableCode.value
    && !tableList.value.some((item) => item.tableCode === selectedTableCode.value)
  ) {
    selectedTableCode.value = undefined;
    tableData.value = [];
  }
  if (!restored && selectedTableCode.value) {
    await loadData();
  }
});

watch(
  () => selectedTableCode.value,
  (val, oldVal) => {
    if (restoringPageState) return;
    if (val !== oldVal) {
      loadData();
    }
  },
);

watch(tableData, async (newVal) => {
  if (newVal?.length > 0) {
    await nextTick();
    initSortable();
  } else {
    destroySortable();
  }
}, { immediate: false });

watch(
  () => searchKeyword.value,
  async () => {
    await nextTick();
    if (tableData.value.length > 0) {
      await initSortable();
    } else {
      destroySortable();
    }
  },
);

watch(
  [selectedRowKeys, selectedTableCode, tableData, tableList, searchKeyword],
  () => {
    if (!restoringPageState) {
      savePageState();
    }
  },
  { deep: true },
);

onActivated(() => {
  // When keep-alive instance is already warm, keep in-memory state as-is.
  if (tableData.value.length === 0) {
    restorePageState();
  }
});

onDeactivated(() => {
  savePageState();
});

onBeforeUnmount(() => {
  savePageState();
  destroySortable();
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
