<template>
  <div class="location-visualizer">
    <!-- 面包屑导航 -->
    <div class="breadcrumb-bar">
      <Breadcrumb>
        <BreadcrumbItem v-for="(item, index) in breadcrumb" :key="index">
          <a @click="handleBreadcrumbClick(item, index)">{{ item.name }}</a>
        </BreadcrumbItem>
      </Breadcrumb>

      <div class="actions">
        <Tooltip :title="$t('page.location.refresh')">
          <Button type="text" @click="handleRefresh">
            <IconifyIcon icon="material-symbols:refresh" />
          </Button>
        </Tooltip>
        <Tooltip :title="$t('page.location.batchCreate')">
          <Button type="text" @click="handleBatchCreate">
            <IconifyIcon icon="material-symbols:group-add" />
          </Button>
        </Tooltip>
      </div>
    </div>

    <!-- 统计信息 -->
    <div v-if="currentNode" class="stats-bar">
      <Card size="small">
        <div class="stats-content">
          <div class="stat-item">
            <span class="label">{{ $t('page.location.containerType') }}：</span>
            <Tag :color="getTypeColor(currentNode.locationType)">{{ getTypeLabel(currentNode.locationType) }}</Tag>
          </div>
          <div v-if="currentNode?.occupancyRate !== undefined" class="stat-item">
            <span class="label">{{ $t('page.location.occupancyRate') }}：</span>
            <Progress
              :percent="occupancyRate"
              :status="getOccupancyStatus(occupancyRate)"
              :stroke-color="getOccupancyColor(occupancyRate)"
              size="small"
              style="width: 120px"
            />
          </div>
          <div class="stat-item">
            <span class="label">{{ $t('page.common.count') }}：</span>
            <span>{{ containers.length }} {{ $t('page.location.containers') }}</span>
          </div>
        </div>
      </Card>
    </div>

    <!-- 可视化区域 -->
    <div class="visual-content">
      <!-- 空状态 -->
      <Empty v-if="!currentNode" :description="$t('page.location.selectParent')" image="simple" />

      <!-- 盒内网格视图（box类型） -->
      <BoxGridView
        v-else-if="currentNode.locationType === 'box'"
        :container="currentNode"
        @select="handleGridSelect"
        @update-grid="handleUpdateGrid"
      />

      <!-- 容器列表视图 -->
      <ContainerGridView v-else :containers="containers" :parent-type="currentNode?.locationType" @select="handleContainerClick" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Breadcrumb, BreadcrumbItem, Button, Card, Empty, Progress, Tag, Tooltip } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import type { LocationApi } from '#/api';
import BoxGridView from './BoxGridView.vue';
import ContainerGridView from './ContainerGridView.vue';

const props = defineProps<{
  currentNode: LocationApi.Container | null;
  containers: LocationApi.Container[];
}>();

const emit = defineEmits<{
  select: [container: LocationApi.Container];
  refresh: [];
}>();

const router = useRouter();
const breadcrumb = ref<LocationApi.Container[]>([]);

// 计算属性
const occupancyRate = computed(() => {
  return Math.round((props.currentNode?.occupancyRate || 0) * 10) / 10;
});

// 监听 currentNode 变化，更新面包屑
watch(() => props.currentNode, (newNode) => {
  if (newNode) {
    // 可以在这里更新面包屑或其他逻辑
    // currentNode changed debug
  }
}, { immediate: true });

// 类型标签（后端返回的是中文，需要映射）
const typeLabels: Record<string, string> = {
  '冰箱': $t('page.location.type.warehouse'),
  '房间': $t('page.location.type.area'),
  '层': $t('page.location.type.area'),
  '库区': $t('page.location.type.area'),
  '架': $t('page.location.type.shelf'),
  '货架': $t('page.location.type.shelf'),
  '行': $t('page.location.type.slot'),
  '货位': $t('page.location.type.slot'),
  '盒': $t('page.location.type.box'),
  '冻存盒': $t('page.location.type.box'),
  '孔': $t('page.location.type.box'),
  // 保留英文映射，以防后端返回英文
  warehouse: $t('page.location.type.warehouse'),
  area: $t('page.location.type.area'),
  shelf: $t('page.location.type.shelf'),
  slot: $t('page.location.type.slot'),
  box: $t('page.location.type.box'),
};

const typeColors: Record<string, string> = {
  '冰箱': 'blue',
  '房间': 'cyan',
  '层': 'cyan',
  '库区': 'cyan',
  '架': 'purple',
  '货架': 'purple',
  '行': 'orange',
  '货位': 'orange',
  '盒': 'green',
  '冻存盒': 'green',
  '孔': 'green',
  // 保留英文映射
  warehouse: 'blue',
  area: 'cyan',
  shelf: 'purple',
  slot: 'orange',
  box: 'green',
};

const getTypeLabel = (type: string) => typeLabels[type] || type;
const getTypeColor = (type: string) => typeColors[type] || 'default';

// 占用率状态
const getOccupancyStatus = (rate: number) => {
  if (rate === 100) return 'exception';
  if (rate > 80) return 'warning';
  if (rate > 50) return 'normal';
  return 'success';
};

// 占用率颜色
const getOccupancyColor = (rate: number) => {
  if (rate === 100) return '#ff4d4f';
  if (rate > 80) return '#fa8c16';
  if (rate > 50) return '#faad14';
  return '#52c41a';
};

// 面包屑点击
const handleBreadcrumbClick = (item: LocationApi.Container, index: number) => {
  breadcrumb.value = breadcrumb.value.slice(0, index + 1);
};

// 刷新
const handleRefresh = () => {
  emit('refresh');
};

// 批量创建
const handleBatchCreate = () => {
  router.push({ name: 'LocationBatchCreate' });
};

// 容器点击
const handleContainerClick = (container: LocationApi.Container) => {
  emit('select', container);
};

// 网格选择
const handleGridSelect = (position: LocationApi.GridPosition) => {
  console.log('Grid selected:', position);
};
</script>

<style scoped lang="less">
.location-visualizer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.breadcrumb-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;

  .actions {
    display: flex;
    gap: 4px;
  }
}

.stats-bar {
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;

  .stats-content {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    align-items: center;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 8px;

    .label {
      color: #666;
    }
  }
}

.visual-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
}
</style>
