<template>
  <Page auto-content-height>
    <!-- 标题区 -->
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon">
          <IconifyIcon icon="material-symbols:location-on" class="text-3xl text-blue-600" />
        </div>
        <div class="header-info">
          <h1 class="header-title">WMS0060 查询库位</h1>
          <p class="header-desc">层级视图 · 图形化展示 · 物料分类</p>
        </div>
      </div>
    </div>

    <!-- 主体内容 -->
    <div class="main-content">
      <!-- 左侧：库位层级树 -->
      <div class="left-panel">
        <div class="panel-header">
          <span class="panel-title">库位层级结构</span>
        </div>
        <div class="legend-bar">
          <span class="legend-item"><span class="dot green" /> &lt;50%</span>
          <span class="legend-item"><span class="dot orange" /> 50-80%</span>
          <span class="legend-item"><span class="dot red" /> &gt;80%</span>
        </div>
        <div class="tree-container">
          <Spin v-if="treeLoading" />
          <Tree
            v-else
            v-model:expandedKeys="expandedKeys"
            :tree-data="treeData"
            :field-names="{ key: 'id', title: 'locationName', children: 'children' }"
            @select="onTreeSelect"
          >
            <template #title="{ dataRef }">
              <div class="tree-node">
                <IconifyIcon
                  :icon="dataRef.isLeaf ? 'material-symbols:grid-on' : 'material-symbols:folder-open'"
                  class="node-icon"
                />
                <span class="node-name">{{ dataRef.locationName }}</span>
                <span v-if="dataRef.occupancyRate !== undefined" :class="['node-rate', getRateClass(dataRef.occupancyRate)]">
                  {{ dataRef.occupancyRate }}%
                </span>
              </div>
            </template>
          </Tree>
        </div>
      </div>

      <!-- 右侧：库存卡片展示 -->
      <div class="right-panel">
        <div v-if="selectedNode" class="right-header">
          <h2 class="right-title">
            存储类型: {{ selectedNode.locationType || '未知' }}
          </h2>
          <p class="right-subtitle">
            总占有率: <span :class="['rate-highlight', getRateClass(selectedNode.occupancyRate)]">{{ selectedNode.occupancyRate || 0 }}%</span>
          </p>
        </div>
        <div v-else class="right-header">
          <h2 class="right-title">请选择左侧库位节点</h2>
        </div>

        <div class="cards-container">
          <Spin v-if="childrenLoading" />
          <Empty v-else-if="!selectedNode" description="点击左侧树节点查看库存详情" />
          <Empty v-else-if="displayChildren.length === 0" description="该节点下暂无子库位" />
          <div v-else class="cards-grid">
            <Card
              v-for="child in displayChildren"
              :key="child.id"
              size="small"
              :class="['location-card', getRateCardClass(child.occupancyRate)]"
              @click="onCardClick(child)"
            >
              <div class="card-header">
                <IconifyIcon icon="material-symbols:grid-on" class="card-icon" />
                <span class="card-title">{{ child.locationName }}</span>
              </div>
              <div class="card-body">
                <div class="card-stat">
                  <span class="stat-label">容器数量</span>
                  <span class="stat-value">{{ child.internalQuantity || 0 }}</span>
                </div>
                <div class="card-stat">
                  <span class="stat-label">占有率</span>
                  <span :class="['stat-value', getRateClass(child.occupancyRate)]">{{ child.occupancyRate || 0 }}%</span>
                </div>
              </div>
              <div class="card-progress">
                <Progress
                  :percent="Math.min(child.occupancyRate || 0, 100)"
                  :show-info="false"
                  :stroke-color="getProgressColor(child.occupancyRate)"
                  :stroke-width="8"
                  size="small"
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  </Page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { Card, Empty, Progress, Spin, Tree, message } from 'ant-design-vue';
import { getTree } from '#/api/wms/location';
import type { LocationTreeNode } from '#/api/wms/location';

// ==================== 状态 ====================
const treeLoading = ref(false);
const childrenLoading = ref(false);
const treeData = ref<any[]>([]);
const expandedKeys = ref<(string | number)[]>([]);
const selectedNode = ref<LocationTreeNode | null>(null);
const rawTree = ref<LocationTreeNode[]>([]);

// ==================== 数据加载 ====================
async function loadTree() {
  treeLoading.value = true;
  try {
    const data = await getTree({ maxLevel: 10 });
    rawTree.value = Array.isArray(data) ? data : [];
    treeData.value = convertToTreeData(rawTree.value);
    // 默认展开第一层
    expandedKeys.value = rawTree.value.map(n => n.id);
  } catch (e: any) {
    message.error(e?.message || '加载库位树失败');
    rawTree.value = [];
    treeData.value = [];
  } finally {
    treeLoading.value = false;
  }
}

// 递归转换数据为 Tree 组件格式
function convertToTreeData(nodes: LocationTreeNode[]): any[] {
  return nodes.map(node => ({
    id: node.id,
    locationName: node.locationName,
    locationType: node.locationType,
    occupancyRate: node.occupancyRate ? Number(node.occupancyRate).toFixed(0) : 0,
    internalQuantity: node.internalQuantity,
    isLeaf: !node.children || node.children.length === 0,
    children: node.children && node.children.length > 0 ? convertToTreeData(node.children) : undefined,
    raw: node,
  }));
}

// ==================== 选中节点处理 ====================
const displayChildren = computed(() => {
  if (!selectedNode.value || !selectedNode.value.children) return [];
  return selectedNode.value.children.map(child => ({
    ...child,
    occupancyRate: child.occupancyRate ? Number(child.occupancyRate).toFixed(0) : 0,
  }));
});

function onTreeSelect(selectedKeys: any[], info: any) {
  const rawNode = info?.node?.raw as LocationTreeNode;
  if (rawNode) {
    selectedNode.value = rawNode;
  }
}

function onCardClick(child: LocationTreeNode) {
  // 点击卡片后，在树中选中对应节点并展开
  selectedNode.value = child;
  if (!expandedKeys.value.includes(child.id)) {
    expandedKeys.value.push(child.id);
  }
}

// ==================== 样式辅助 ====================
function getRateClass(rate: number | string | undefined): string {
  const r = Number(rate) || 0;
  if (r < 50) return 'rate-low';
  if (r <= 80) return 'rate-mid';
  return 'rate-high';
}

function getRateCardClass(rate: number | string | undefined): string {
  const r = Number(rate) || 0;
  if (r >= 80) return 'card-high';
  if (r >= 50) return 'card-mid';
  return 'card-low';
}

function getProgressColor(rate: number | string | undefined): string {
  const r = Number(rate) || 0;
  if (r >= 80) return '#ef4444';
  if (r >= 50) return '#f97316';
  return '#22c55e';
}

onMounted(() => {
  loadTree();
});
</script>

<style scoped>
.page-header {
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  width: 48px;
  height: 48px;
  background: #eff6ff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  line-height: 1.4;
}

.header-desc {
  font-size: 13px;
  color: #6b7280;
  margin: 4px 0 0;
}

.main-content {
  display: flex;
  height: calc(100vh - 140px);
  background: #fff;
}

/* 左侧面板 */
.left-panel {
  width: 320px;
  min-width: 320px;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 16px 16px 8px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.legend-bar {
  padding: 0 16px 12px;
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #6b7280;
  border-bottom: 1px solid #f0f0f0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.dot.green { background: #22c55e; }
.dot.orange { background: #f97316; }
.dot.red { background: #ef4444; }

.tree-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.node-icon {
  font-size: 16px;
  color: #6b7280;
  flex-shrink: 0;
}

.node-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-rate {
  font-weight: 600;
  font-size: 12px;
  flex-shrink: 0;
  margin-left: 4px;
}

.rate-low { color: #22c55e; }
.rate-mid { color: #f97316; }
.rate-high { color: #ef4444; }

/* 右侧面板 */
.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px 24px;
  overflow-y: auto;
}

.right-header {
  margin-bottom: 20px;
}

.right-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px;
}

.right-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.rate-highlight {
  font-weight: 700;
  font-size: 16px;
}

.cards-container {
  flex: 1;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.location-card {
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.location-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.card-high {
  background: #fef2f2;
  border-color: #fecaca;
}

.card-mid {
  background: #fff7ed;
  border-color: #fed7aa;
}

.card-low {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.card-icon {
  font-size: 20px;
  color: #4b5563;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.card-body {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.card-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.card-progress {
  margin-top: 4px;
}

:deep(.ant-tree-treenode) {
  padding: 4px 0;
}

:deep(.ant-tree-node-content-wrapper) {
  padding: 2px 4px;
  border-radius: 4px;
}

:deep(.ant-tree-node-content-wrapper:hover) {
  background: #f3f4f6;
}

:deep(.ant-tree-node-selected .ant-tree-node-content-wrapper) {
  background: #dbeafe !important;
}
</style>
