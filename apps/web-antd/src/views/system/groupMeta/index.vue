<template>
  <WmsPageLayout title="分组元数据" description="管理低代码表单分组配置">
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
              option-filter-prop="label"
              @change="(value) => handleTableChange(value as string | number | undefined)"
            >
              <SelectOption
                v-for="table in tableList"
                :key="table.tableCode"
                :value="table.tableCode"
                :label="`${table.tableCode} - ${table.tableName}`"
              >
                {{ table.tableCode }} - {{ table.tableName }}
              </SelectOption>
            </Select>

            <Input.Search
              v-model:value="searchKeyword"
              placeholder="搜索分组编码 / 标题"
              allow-clear
              style="width: 260px"
              @search="handleSearch"
            />
          </div>

          <div class="right-tools">
            <Button type="primary" :disabled="!selectedTableCode" @click="handleAdd">新增分组</Button>
            <Button :disabled="!selectedTableCode" @click="handleSaveSort">保存排序</Button>
          </div>
        </div>
      </Card>
    </template>

    <WmsDataTable
      :columns="columns"
      :data-source="tableData"
      :loading="loading"
      :pagination="false"
      row-key="id"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'seq'">
          {{ index + 1 }}
        </template>
        <template v-else-if="column.key === 'groupType'">
          <Tag :color="record.groupType === 'collapse' ? 'processing' : 'default'">
            {{ record.groupType === 'collapse' ? 'Collapse' : 'Card' }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'defaultOpen'">
          <Tag :color="record.defaultOpen === 1 ? 'success' : 'default'">
            {{ record.defaultOpen === 1 ? '默认展开' : '默认折叠' }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'refCount'">
          <Tag :color="Number(record.refCount || 0) > 0 ? 'success' : 'default'">
            {{ Number(record.refCount || 0) }}
          </Tag>
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
        <template v-else-if="column.key === 'remarks'">
          <Tooltip :title="record.remarks || '-'">
            <span class="ellipsis">{{ record.remarks || '-' }}</span>
          </Tooltip>
        </template>
        <template v-else-if="column.key === 'action'">
          <Space>
            <Button type="link" size="small" @click="handleEdit(record)">编辑</Button>
            <Button type="link" size="small" @click="handleAssign(record)">分配字段</Button>
            <Popconfirm
              title="确认删除这个分组吗？"
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

    <GroupMetaModal
      v-model:visible="modalVisible"
      :mode="modalMode"
      :data="currentRecord"
      :table-code="selectedTableCode"
      @success="handleModalSuccess"
    />
    <AssignFieldsModal
      v-if="assignRecord"
      v-model:visible="assignModalVisible"
      :table-code="selectedTableCode"
      :group-code="assignRecord.groupCode"
      :group-title="assignRecord.groupTitle"
      :group-type="assignRecord.groupType || 'card'"
      :sort-order="Number(assignRecord.sortOrder || 0)"
      @success="handleModalSuccess"
    />
  </WmsPageLayout>
</template>

<script setup lang="ts">
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch } from 'vue';
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
import { getColumnMetaByTableId, getTableMetaListForSelect } from '#/api/system/columnMeta';
import {
  batchSortGroupMeta,
  deleteGroupMeta,
  getGroupMetaList,
  type GroupMetaApi,
} from '#/api/system/groupMeta';

import GroupMetaModal from './modules/group-meta-modal.vue';
import AssignFieldsModal from './modules/assign-fields-modal.vue';

const loading = ref(false);
const tableLoading = ref(false);
const searchKeyword = ref('');
const selectedTableCode = ref<string>('');
const tableList = ref<Array<{ id: number; tableCode: string; tableName: string }>>([]);
type GroupMetaRow = GroupMetaApi.GroupMeta & { refCount: number };
const tableDataRaw = ref<GroupMetaRow[]>([]);
const tableData = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  if (!keyword) return tableDataRaw.value;
  return tableDataRaw.value.filter(
    (item) =>
      item.groupCode?.toLowerCase().includes(keyword) ||
      item.groupTitle?.toLowerCase().includes(keyword),
  );
});

const modalVisible = ref(false);
const modalMode = ref<'add' | 'edit'>('add');
const currentRecord = ref<GroupMetaApi.GroupMeta | null>(null);

const assignModalVisible = ref(false);
const assignRecord = ref<GroupMetaApi.GroupMeta | null>(null);

type GroupMetaPageState = {
  searchKeyword: string;
  selectedTableCode: string;
  tableList: Array<{ id: number; tableCode: string; tableName: string }>;
  tableDataRaw: GroupMetaRow[];
};
const GROUP_META_STATE_KEY = 'system-group-meta-page-state-v1';
const GROUP_META_NON_EMPTY_STATE_KEY = 'system-group-meta-page-state-non-empty-v1';
let groupMetaStateCache: GroupMetaPageState | null = null;
let groupMetaNonEmptyStateCache: GroupMetaPageState | null = null;

function savePageState() {
  const state: GroupMetaPageState = {
    searchKeyword: searchKeyword.value,
    selectedTableCode: selectedTableCode.value,
    tableList: [...tableList.value],
    tableDataRaw: [...tableDataRaw.value],
  };
  // Guard against transient empty snapshots during tab switch.
  if (!state.selectedTableCode && state.tableDataRaw.length === 0 && groupMetaNonEmptyStateCache) {
    return;
  }
  groupMetaStateCache = state;
  try {
    sessionStorage.setItem(GROUP_META_STATE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
  if (state.selectedTableCode || state.tableDataRaw.length > 0) {
    groupMetaNonEmptyStateCache = state;
    try {
      sessionStorage.setItem(GROUP_META_NON_EMPTY_STATE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }
}

function restorePageState() {
  let state = groupMetaStateCache;
  if (!state) {
    try {
      const raw = sessionStorage.getItem(GROUP_META_STATE_KEY);
      if (raw) state = JSON.parse(raw) as GroupMetaPageState;
    } catch {
      // ignore
    }
  }
  if (!state || (!state.selectedTableCode && state.tableDataRaw.length === 0)) {
    let fallback = groupMetaNonEmptyStateCache;
    if (!fallback) {
      try {
        const raw = sessionStorage.getItem(GROUP_META_NON_EMPTY_STATE_KEY);
        if (raw) {
          fallback = JSON.parse(raw) as GroupMetaPageState;
          groupMetaNonEmptyStateCache = fallback;
        }
      } catch {
        // ignore
      }
    }
    if (fallback) {
      state = fallback;
    }
  }
  if (!state) return false;
  groupMetaStateCache = state;
  searchKeyword.value = state.searchKeyword || '';
  selectedTableCode.value = state.selectedTableCode || '';
  tableList.value = [...(state.tableList || [])];
  tableDataRaw.value = [...(state.tableDataRaw || [])];
  return true;
}

const columns = computed<TableColumnsType<GroupMetaRow>>(() => [
  { title: '序号', key: 'seq', width: 70, align: 'center' },
  { title: '分组编码', dataIndex: 'groupCode', key: 'groupCode', width: 180 },
  { title: '分组标题', dataIndex: 'groupTitle', key: 'groupTitle', width: 180 },
  { title: '容器类型', key: 'groupType', width: 110, align: 'center' },
  { title: '默认展开', key: 'defaultOpen', width: 110, align: 'center' },
  { title: '引用字段', key: 'refCount', width: 100, align: 'center' },
  { title: '排序', key: 'sortOrder', width: 100, align: 'center' },
  { title: '状态', key: 'status', width: 90, align: 'center' },
  { title: '备注', key: 'remarks', width: 240 },
  { title: '操作', key: 'action', width: 120, align: 'center', fixed: 'right' },
]);

function handleSearch() {
  // 使用计算属性过滤
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
    // Keep current data when table code is transiently empty during tab switches.
    return;
  }
  loading.value = true;
  try {
    const [res, columnList] = await Promise.all([
      getGroupMetaList(selectedTableCode.value),
      getColumnMetaByTableId(selectedTableCode.value),
    ]);
    const refCountMap = (columnList || []).reduce<Record<string, number>>((result, item: any) => {
      const key = String(item?.sectionKey || '').trim();
      if (!key) return result;
      result[key] = (result[key] || 0) + 1;
      return result;
    }, {});
    tableDataRaw.value = (res.rows || [])
      .map((item) => ({
        ...item,
        refCount: Number(refCountMap[item.groupCode] || 0),
      }))
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  } catch (error: any) {
    tableDataRaw.value = [];
    message.error(error?.message || '加载分组元数据失败');
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

function handleEdit(record: GroupMetaRow) {
  modalMode.value = 'edit';
  currentRecord.value = { ...record };
  modalVisible.value = true;
}

function handleAssign(record: GroupMetaRow) {
  assignRecord.value = { ...record };
  assignModalVisible.value = true;
}

async function handleDelete(record: GroupMetaRow) {
  if (!record.id) return;
  try {
    await deleteGroupMeta(record.id);
    message.success('删除成功');
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '删除失败');
  }
}

async function handleSaveSort() {
  const payload = tableData.value
    .filter((item) => item.id)
    .map((item) => ({ id: item.id, sortOrder: Number(item.sortOrder || 0) }));

  try {
    await batchSortGroupMeta(payload as Array<{ id: number; sortOrder: number }>);
    message.success('排序已保存');
  } catch (error: any) {
    message.error(error?.message || '排序保存失败');
  } finally {
    await loadData();
  }
}

function handleModalSuccess() {
  loadData();
}

function handleTableChange(value?: string | number) {
  if (!value) return;
  selectedTableCode.value = String(value);
  void loadData();
}

onMounted(async () => {
  const restored = restorePageState();
  if (!tableList.value.length) {
    await loadTableList();
  }
  if (!restored) {
    await loadData();
  }
});

watch([searchKeyword, selectedTableCode, tableList, tableDataRaw], savePageState, {
  deep: true,
});

onActivated(() => {
  // When keep-alive instance is already warm, keep in-memory state as-is.
  if (tableDataRaw.value.length === 0) {
    restorePageState();
  }
});
onDeactivated(() => {
  savePageState();
});
onBeforeUnmount(() => {
  savePageState();
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
