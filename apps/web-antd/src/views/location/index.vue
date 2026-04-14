<template>
  <Page auto-content-height class="location-page">
    <div class="location-layout">
      <!-- 左侧：库位树形列表 -->
      <div class="left-panel">
        <Grid class="location-grid">
          <template #toolbar-tools>
            <Button v-access:code="'wms:location:add'" type="primary" class="mr-2" @click="handleAddRoot">
              <IconifyIcon icon="material-symbols:add" class="size-5" />
              {{ $t('page.location.addRoot') }}
            </Button>
            <Button class="mr-2" @click="handleExpandAll">
              <IconifyIcon icon="material-symbols:expand-all" class="size-5" />
              {{ $t('page.common.expandAll') }}
            </Button>
            <Button @click="handleCollapseAll">
              <IconifyIcon icon="material-symbols:collapse-all" class="size-5" />
              {{ $t('page.common.collapseAll') }}
            </Button>
          </template>

          <template #name="{ row }">
            <div class="tree-node-title">
              <span class="node-icon">
                <IconifyIcon :icon="getNodeIcon(row.locationType)" />
              </span>
              <span class="node-name">{{ row.locationName }}</span>
              <span v-if="row.locationNo" class="node-code">({{ row.locationNo }})</span>
            </div>
          </template>

          <template #type="{ row }">
            <Tag :color="getTypeColor(row.locationType)">{{ getTypeLabel(row.locationType) }}</Tag>
          </template>

          <template #status="{ row }">
            <Switch
              :checked="row.isUse"
              :checkedValue="0"
              :unCheckedValue="1"
              @change="() => handleStatusChange(row)"
            />
          </template>

          <template #capacity="{ row }">
            <div v-if="row.capacityTotal" class="capacity-cell">
              <Progress
                :percent="getOccupancyRate(row)"
                :status="getOccupancyStatus(row)"
                size="small"
                :stroke-color="getOccupancyColor(row)"
              />
              <span class="capacity-text">{{ row.capacityUsed || 0 }} / {{ row.capacityTotal }}</span>
            </div>
            <span v-else>-</span>
          </template>

          <template #action="{ row }">
            <Button v-access:code="'wms:location:add'" v-if="canAddChild(row.locationType)" type="link" @click="handleAddChild(row)">
              {{ $t('page.location.addChild') }}
            </Button>
            <Button v-access:code="'wms:location:edit'" type="link" @click="handleEdit(row)">{{ $t('page.common.edit') }}</Button>
            <Button v-access:code="'wms:location:delete'" type="link" danger @click="handleDelete(row)">{{ $t('page.common.delete') }}</Button>
          </template>
        </Grid>
      </div>

      <!-- 中间：可视化展示 -->
      <div class="center-panel">
        <LocationVisualizer
          :current-node="selectedNode"
          :children="containerList"
          @select="handleContainerSelect"
          @refresh="handleRefresh"
        />
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <LocationModal ref="modalRef" :location-tree="treeData" @success="handleModalSuccess" />
  </Page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Page } from '@vben/common-ui';
import { message, Button, Switch, Modal, Tag, Progress } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import type { VbenFormProps } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';

import {
  getLocationTree,
  getLocationChildren,
  deleteLocation,
  updateLocation,
  updateGridConfig,
  type LocationApi,
} from '#/api';

import LocationVisualizer from './components/LocationVisualizer.vue';
import LocationModal from './modules/location-modal.vue';
const treeData = ref<LocationApi.Container[]>([]);
const selectedNode = ref<LocationApi.Container | null>(null);
const selectedContainer = ref<LocationApi.Container | null>(null);
const containerList = ref<LocationApi.Container[]>([]);

// 容器类型数据（静态配置）
const containerTypeMap = ref<Record<string, { label: string; color: string }>>({
  warehouse: { label: $t('page.location.type.warehouse'), color: 'blue' },
  area: { label: $t('page.location.type.area'), color: 'cyan' },
  shelf: { label: $t('page.location.type.shelf'), color: 'purple' },
  slot: { label: $t('page.location.type.slot'), color: 'orange' },
  box: { label: $t('page.location.type.box'), color: 'green' },
});

// 图标映射 - 从枚举数据动态生成
const iconMap = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {};
  Object.keys(containerTypeMap.value).forEach((key) => {
    // 根据类型关键字匹配图标
    if (key.includes('warehouse')) map[key] = 'material-symbols:warehouse';
    else if (key.includes('area')) map[key] = 'material-symbols:map';
    else if (key.includes('shelf')) map[key] = 'material-symbols:shelves';
    else if (key.includes('slot')) map[key] = 'material-symbols:grid-view';
    else if (key.includes('box')) map[key] = 'material-symbols:box';
    else map[key] = 'material-symbols:folder';
  });
  return map;
});

const getNodeIcon = (type: string) => iconMap.value[type] || 'material-symbols:folder';

// 类型标签 - 从枚举数据获取
const getTypeLabel = (type: string) => containerTypeMap.value[type]?.label || type;
const getTypeColor = (type: string) => containerTypeMap.value[type]?.color || 'default';

// 是否可以添加子节点
const canAddChild = (type: string) => type !== 'box';

// 占用率计算 - 修复：使用统一字段名
const getOccupancyRate = (row: LocationApi.Container) => {
  if (!row.capacityTotal) return 0;
  return Math.round(((row.capacityUsed || 0) / row.capacityTotal) * 100);
};

const getOccupancyStatus = (row: LocationApi.Container) => {
  const rate = getOccupancyRate(row);
  if (rate >= 90) return 'exception';
  if (rate >= 70) return 'normal';
  return 'success';
};

const getOccupancyColor = (row: LocationApi.Container) => {
  const rate = getOccupancyRate(row);
  if (rate >= 90) return '#ff4d4f';
  if (rate >= 70) return '#faad14';
  return '#52c41a';
};

// 选中节点变化 - 加载子容器
const handleRowSelect = async (row: LocationApi.Container) => {
  console.log('handleRowSelect:', row);
  selectedNode.value = row;
  selectedContainer.value = row;

  // 如果 row 已经有 children 数据，直接使用
  if (row.children && row.children.length > 0) {
    containerList.value = row.children;
    return;
  }

  // 否则从 API 加载子节点
  try {
    const res = await getLocationChildren(row.id);
    containerList.value = res || [];
    // 将加载的子节点缓存到当前行
    row.children = res || [];
  } catch (error) {
    containerList.value = [];
  }
};

// 搜索表单配置
const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: true,
  schema: [
    {
      component: 'Input',
      fieldName: 'locationName',
      label: $t('page.location.containerName'),
    },
    {
      component: 'Select',
      fieldName: 'locationType',
      label: $t('page.location.containerType'),
      componentProps: {
        allowClear: true,
        options: computed(() => {
          return Object.entries(containerTypeMap.value).map(([key, value]) => ({
            label: value.label,
            value: key,
          }));
        }),
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: $t('page.common.status'),
      componentProps: {
        allowClear: true,
        options: [
          { label: $t('page.common.enabled'), value: 'enabled' },
          { label: $t('page.common.disabled'), value: 'disabled' },
        ],
      },
    },
  ],
};

// 表格配置
const gridOptions = {
  columns: [
    { type: 'seq', width: 50, title: $t('page.common.seq') },
    { field: 'locationName', title: $t('page.location.containerName'), treeNode: true, minWidth: 280, slots: { default: 'name' } },
    { field: 'locationNo', title: $t('page.location.containerCode'), minWidth: 120 },
    { field: 'locationType', title: $t('page.location.containerType'), width: 100, slots: { default: 'type' } },
    { field: 'status', title: $t('page.common.status'), width: 90, slots: { default: 'status' } },
    { field: 'capacityTotal', title: $t('page.location.capacity'), minWidth: 160, slots: { default: 'capacity' } },
    { field: 'action', title: $t('page.common.operation'), fixed: 'right', slots: { default: 'action' }, width: 220 },
  ],
  height: 'auto',
  treeConfig: {
    transform: false,
    rowField: 'id',
    parentField: 'parentId',
    childrenField: 'children',
    hasChildrenField: 'hasChildren',
    expandAll: false,
  },
  pagerConfig: {
    enabled: false,
  },
  proxyConfig: {
    ajax: {
      query: async ({ page }: any, formValues: any) => {
        const res = await getLocationTree(formValues);
        // 后端已返回树形结构，直接使用
        const tree = res || [];
        treeData.value = tree;
        return { rows: tree };
      },
    },
  },
  rowConfig: {
    isCurrent: true,
    isHover: true,
  },
  // 事件监听
  onCurrentChange: ({ row }: any) => {
    console.log('current-change:', row);
    if (row) {
      handleRowSelect(row);
    }
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

// 构建树形结构
const buildTree = (list: LocationApi.Container[]): LocationApi.Container[] => {
  const map = new Map<string, LocationApi.Container>();
  const tree: LocationApi.Container[] = [];

  list.forEach((item) => {
    map.set(item.id, { ...item, children: [] });
  });

  list.forEach((item) => {
    const node = map.get(item.id)!;
    if (item.parentId && map.has(item.parentId)) {
      const parent = map.get(item.parentId)!;
      parent.children = parent.children || [];
      parent.children.push(node);
    } else {
      tree.push(node);
    }
  });

  return tree;
};

// 展开/收起全部
const handleExpandAll = () => {
  gridApi.grid?.setAllTreeExpand(true);
};

const handleCollapseAll = () => {
  gridApi.grid?.setAllTreeExpand(false);
};

// 状态变更
const handleStatusChange = async (row: LocationApi.Container) => {
  const nextStatus = row.status;
  Modal.confirm({
    title: $t('page.common.confirm'),
    content: $t(nextStatus === 'disabled' ? 'page.location.confirmDisable' : 'page.location.confirmEnable', { name: row.locationName }),
    async onOk() {
      try {
        await updateLocation(row.id, { status: nextStatus });
        message.success($t('page.message.operationSuccess'));
        gridApi.reload();
      } catch (error) {
        message.error($t('page.message.operationFail'));
        row.status = nextStatus === 'enabled' ? 'disabled' : 'enabled';
      }
    },
  });
};

// 添加根节点
const handleAddRoot = () => {
  modalRef.value?.open();
};

// 添加子节点
const handleAddChild = (row: LocationApi.Container) => {
  modalRef.value?.open({ parentId: row.id, parentType: row.locationType });
};

// 编辑
const handleEdit = (row: LocationApi.Container) => {
  modalRef.value?.open(row);
};

// 删除
const handleDelete = async (row: LocationApi.Container) => {
  Modal.confirm({
    title: $t('page.common.confirmDelete'),
    content: $t('page.location.confirmDelete', { name: row.locationName }),
    async onOk() {
      await deleteLocation(row.id);
      message.success($t('page.message.deleteSuccess'));
      gridApi.reload();
    },
  });
};

// 行点击处理
const handleRowClick = ({ row }: any) => {
  console.log('Row clicked:', row);
  if (row) {
    handleRowSelect(row);
  }
};

// 容器选择
const handleContainerSelect = (container: LocationApi.Container) => {
  selectedContainer.value = container;
  // 同步选中树节点
  gridApi.grid?.setCurrentRow(container);
  handleRowSelect(container);
};

// 保存属性
const handleSaveProperty = async (data: Partial<LocationApi.Container>) => {
  if (!selectedContainer.value) return;

  try {
    await updateLocation(selectedContainer.value.id, data);
    message.success($t('page.message.saveSuccess'));
    gridApi.reload();
    Object.assign(selectedContainer.value, data);
  } catch (error) {
    message.error($t('page.message.saveFail'));
  }
};

// 更新网格配置
const handleUpdateGrid = async (gridConfig: LocationApi.GridPosition[]) => {
  if (!selectedContainer.value || selectedContainer.value.locationType !== 'box') return;

  try {
    await updateGridConfig(selectedContainer.value.id, gridConfig);
    message.success($t('page.message.saveSuccess'));
    selectedContainer.value.gridConfig = gridConfig;
  } catch (error) {
    message.error($t('page.message.saveFail'));
  }
};

// 刷新
const handleRefresh = () => {
  if (selectedNode.value) {
    handleRowSelect(selectedNode.value);
  }
};

// 弹窗成功回调
const handleModalSuccess = () => {
  gridApi.reload();
  handleRefresh();
};

<style scoped lang="less">
.location-page {
  :deep(.page-content) {
    padding: 0;
  }
}

.location-layout {
  display: flex;
  height: 100%;
  min-height: calc(100vh - 120px);
  background: #f0f2f5;
}

.left-panel {
  width: 70%;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  overflow: hidden;

  :deep(.vxe-grid) {
    height: 100%;
  }
}

.center-panel {
  flex: 1;
  min-width: 0;
  padding: 16px;
  overflow: auto;
}

.tree-node-title {
  display: flex;
  align-items: center;
  gap: 4px;

  .node-icon {
    color: #1890ff;
    font-size: 16px;
  }

  .node-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .node-code {
    color: #999;
    font-size: 12px;
  }
}

.capacity-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .capacity-text {
    font-size: 12px;
    color: #666;
    white-space: nowrap;
  }
}
</style>
