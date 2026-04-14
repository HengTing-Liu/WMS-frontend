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
              :filter-option="filterTableOption"
              @change="loadData"
            >
              <SelectOption v-for="table in tableList" :key="table.tableCode" :value="table.tableCode">
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
import { getColumnMetaByTableId, getTableMetaListForSelect } from '#/api/system/columnMeta';
import {
  batchSortGroupMeta,
  deleteGroupMeta,
  getGroupMetaList,
  type GroupMetaApi,
} from '#/api/system/groupMeta';

import GroupMetaModal from './modules/group-meta-modal.vue';

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

function filterTableOption(input: string, option: any) {
  const text = option.children?.() || option.children || '';
  return String(text).toLowerCase().includes(input.toLowerCase());
}

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
    tableDataRaw.value = [];
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
