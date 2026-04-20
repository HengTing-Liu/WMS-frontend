<template>
  <div class="hierarchy-node">
    <div
      class="hierarchy-row"
      :style="rowStyle"
      @mouseenter="showActions = true"
      @mouseleave="showActions = false"
      @click="toggle"
    >
      <span class="hierarchy-toggle">
        <IconifyIcon
          v-if="hasChildren"
          :icon="expanded ? 'material-symbols:keyboard-arrow-down' : 'material-symbols:keyboard-arrow-right'"
        />
        <span v-else class="toggle-placeholder" />
      </span>
      <span class="hierarchy-icon" :style="{ color: getNodeConfig(node).color }">
        <IconifyIcon :icon="getNodeConfig(node).icon" />
      </span>
      <span class="hierarchy-text">
        {{ getNodeConfig(node).label }}：{{ node.locationType }}【{{ node.locationName }}】&nbsp;&nbsp;({{ node.internalSerialNo ?? '-' }}/{{ node.internalQuantity ?? '-' }})
        <template v-if="(node.locationGrade === 'Container' || node.locationGrade === '存储容器') && node.specification">
          &nbsp;&nbsp;{{ node.specification }}
        </template>
      </span>
      <!-- 悬停操作按钮 -->
      <span v-show="showActions" class="node-actions" @click.stop>
        <Button
          v-if="canAddSectionForNode"
          size="small"
          type="link"
          class="action-btn"
          @click="handleAddSection"
        >
          <template #icon><IconifyIcon icon="material-symbols:playlist-add" /></template>
          新建分区
        </Button>
        <Button
          v-if="canAddContainerForNode"
          size="small"
          type="link"
          class="action-btn"
          @click="handleAddContainer"
        >
          <template #icon><IconifyIcon icon="material-symbols:inventory-2" /></template>
          新建容器
        </Button>
        <Button
          size="small"
          type="link"
          class="action-btn"
          @click="handleEdit"
        >
          <template #icon><IconifyIcon icon="material-symbols:edit" /></template>
          编辑
        </Button>
        <Button
          size="small"
          type="link"
          danger
          class="action-btn"
          @click="handleDelete"
        >
          <template #icon><IconifyIcon icon="material-symbols:delete" /></template>
          删除
        </Button>
        <Button
          v-if="canAssignWarehouseForNode"
          size="small"
          type="link"
          class="action-btn"
          @click="handleAssignWarehouse"
        >
          <template #icon><IconifyIcon icon="material-symbols:warehouse" /></template>
          分配仓库
        </Button>
      </span>
    </div>
    <div v-if="expanded && isLeafGrid" class="position-grid" :style="indentStyle">
      <div
        v-for="child in node.children"
        :key="child.id"
        class="position-card"
        :class="child.isUse === 1 ? 'occupied' : 'free'"
      >
        {{ child.locationName }}
      </div>
    </div>
    <template v-if="expanded && !isLeafGrid">
      <HierarchyNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :level="level + 1"
        @add-section="$emit('addSection', $event)"
        @add-container="$emit('addContainer', $event)"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
        @assign-warehouse="$emit('assignWarehouse', $event)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue';
import { Button } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import type { LocationTreeNode } from '#/api/wms/location';

interface Props {
  node: LocationTreeNode;
  level?: number;
}

const props = withDefaults(defineProps<Props>(), {
  level: 0,
});

const emit = defineEmits<{
  (e: 'addSection', node: LocationTreeNode): void;
  (e: 'addContainer', node: LocationTreeNode): void;
  (e: 'edit', node: LocationTreeNode): void;
  (e: 'delete', node: LocationTreeNode): void;
  (e: 'assignWarehouse', node: LocationTreeNode): void;
}>();

const expanded = ref(true);
const showActions = ref(false);

const rowStyle = computed(() => ({
  marginLeft: `${props.level * 40}px`,
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  lineHeight: '20px',
}));

const indentStyle = computed(() => ({
  marginLeft: `${props.level * 40 + 24}px`,
}));

const hasChildren = computed(() => {
  const children = props.node.children || [];
  return children.length > 0;
});

const isLeafGrid = computed(() => {
  const children = props.node.children || [];
  if (children.length === 0) return false;
  const firstGrade = children[0]?.locationGrade || '';
  return firstGrade === 'ContainerPosition' || firstGrade === '存储孔位';
});

// 孔位不显示任何操作按钮
const isPositionNode = computed(() => {
  const grade = props.node.locationGrade || '';
  return grade === 'ContainerPosition' || grade === '存储孔位';
});

// 新建分区：非孔位且非存储容器节点
const canAddSectionForNode = computed(() => {
  if (isPositionNode.value) return false;
  const grade = props.node.locationGrade || '';
  return grade !== 'Container' && grade !== '存储容器';
});

// 新建容器：仅"存储分区"且没有"存储分区"子节点时
const canAddContainerForNode = computed(() => {
  const grade = props.node.locationGrade;
  if (!grade || (grade !== 'StorageSection' && grade !== 'TypeSection' && grade !== '存储分区')) {
    return false;
  }
  const children = props.node.children || [];
  const hasSectionChild = children.some((child) => {
    const g = child.locationGrade || '';
    return g === 'StorageSection' || g === 'TypeSection' || g === '存储分区';
  });
  return !hasSectionChild;
});

// 分配仓库：非孔位节点都可以（与工具栏规则一致：只要 selectedNodeId 存在即可）
const canAssignWarehouseForNode = computed(() => !isPositionNode.value);

const gradeConfig: Record<string, { icon: string; color: string; label: string }> = {
  StorageType: { icon: 'material-symbols:kitchen', color: '#722ed1', label: '存储对象' },
  Type: { icon: 'material-symbols:kitchen', color: '#722ed1', label: '存储对象' },
  存储对象: { icon: 'material-symbols:kitchen', color: '#722ed1', label: '存储对象' },
  StorageSection: { icon: 'material-symbols:grid-view', color: '#1890ff', label: '存储分区' },
  TypeSection: { icon: 'material-symbols:grid-view', color: '#1890ff', label: '存储分区' },
  存储分区: { icon: 'material-symbols:grid-view', color: '#1890ff', label: '存储分区' },
  Container: { icon: 'material-symbols:box', color: '#52c41a', label: '存储容器' },
  存储容器: { icon: 'material-symbols:box', color: '#52c41a', label: '存储容器' },
  ContainerPosition: { icon: 'material-symbols:circle', color: '#fa8c16', label: '孔位' },
  存储孔位: { icon: 'material-symbols:circle', color: '#fa8c16', label: '孔位' },
};

function getNodeConfig(node: LocationTreeNode) {
  return gradeConfig[node.locationGrade || ''] || {
    icon: 'material-symbols:folder',
    color: '#595959',
    label: node.locationGrade || '节点',
  };
}

function toggle() {
  if (hasChildren.value) {
    expanded.value = !expanded.value;
  }
}

function handleAddSection() {
  emit('addSection', props.node);
}

function handleAddContainer() {
  emit('addContainer', props.node);
}

function handleEdit() {
  emit('edit', props.node);
}

function handleDelete() {
  emit('delete', props.node);
}

function handleAssignWarehouse() {
  emit('assignWarehouse', props.node);
}

const injectedTick = inject<{ tick: ReturnType<typeof ref<number>>; value: ReturnType<typeof ref<boolean>> } | null>('hierarchyExpand', null);
if (injectedTick) {
  watch(() => injectedTick.tick.value, () => {
    expanded.value = injectedTick.value.value;
  }, { immediate: true });
}
</script>

<style scoped>
.hierarchy-node {
  position: relative;
}

.hierarchy-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 0;
  font-size: 14px;
  cursor: pointer;
  user-select: none;
  border-radius: 4px;
  transition: background 0.2s;
  position: relative;
}

.hierarchy-row:hover {
  background: rgba(0, 0, 0, 0.04);
}

.hierarchy-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: #8c8c8c;
}

.hierarchy-toggle :deep(svg) {
  width: 20px;
  height: 20px;
}

.toggle-placeholder {
  display: block;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.hierarchy-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  font-size: 18px;
}

.hierarchy-text {
  color: #262626;
  font-size: 14px;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: 8px;
  flex-shrink: 0;
  animation: fadeIn 0.15s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-4px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.action-btn {
  padding: 0 4px;
  font-size: 12px;
  height: 22px;
  line-height: 22px;
}

.action-btn :deep(.ant-btn-link-content) {
  display: flex;
  align-items: center;
  gap: 2px;
}

.position-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 6px;
  margin-bottom: 14px;
}

.position-card {
  min-width: 64px;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid;
  text-align: center;
  font-size: 13px;
  font-weight: 500;
}

.position-card.free {
  border-color: #b7eb8f;
  background: #f6ffed;
  color: #52c41a;
}

.position-card.occupied {
  border-color: #ffa39e;
  background: #fff1f0;
  color: #ff4d4f;
}
</style>
