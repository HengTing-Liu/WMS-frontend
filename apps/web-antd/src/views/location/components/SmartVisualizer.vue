<template>
  <div class="smart-visualizer">
    <!-- 面包屑导航 -->
    <div class="breadcrumb-bar">
      <Breadcrumb>
        <BreadcrumbItem v-for="(item, index) in breadcrumb" :key="index">
          <a @click="handleBreadcrumbClick(item, index)">{{ item.locationName }}</a>
        </BreadcrumbItem>
      </Breadcrumb>
      <div class="actions">
        <Tooltip :title="$t('page.location.refresh')">
          <Button type="text" @click="handleRefresh">
            <IconifyIcon icon="material-symbols:refresh" />
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
            <Tag :color="getTypeColor(currentNode.locationType)">{{ currentNode.locationType }}</Tag>
          </div>
          <div class="stat-item">
            <span class="label">{{ $t('page.location.containerCode') }}：</span>
            <span>{{ currentNode.locationName }}</span>
          </div>
          <div class="stat-item">
            <span class="label">{{ $t('page.common.count') }}：</span>
            <span>{{ children.length }} {{ getChildTypeLabel() }}</span>
          </div>
        </div>
      </Card>
    </div>

    <!-- 可视化区域 - 根据子类型动态渲染 -->
    <div class="visual-content">
      <!-- 空状态 -->
      <Empty v-if="!currentNode" :description="$t('page.location.selectParent')" image="simple" />
      
      <!-- 加载中 -->
      <div v-else-if="loading" class="loading-state">
        <Spin />
      </div>

      <!-- 根据当前节点类型选择渲染模板 -->
      <template v-else>
        <!-- 当前是孔 - 显示详情，不显示可视化 -->
        <div v-if="currentNodeType === '孔' || currentNodeType === 'ContainerPosition'" class="well-detail">
          <Card :title="$t('page.location.holeDetail')">
            <div class="detail-content">
              <div class="detail-item">
                <span class="label">{{ $t('page.location.holeName') }}：</span>
                <span>{{ currentNode?.locationName }}</span>
              </div>
              <div class="detail-item">
                <span class="label">{{ $t('page.location.holeCode') }}：</span>
                <span>{{ currentNode?.locationName }}</span>
              </div>
              <div class="detail-item">
                <span class="label">{{ $t('page.common.status') }}：</span>
                <Tag :color="currentNode?.isUse === 1 ? 'red' : 'green'">
                  {{ currentNode?.isUse === 1 ? $t('page.location.occupied') : $t('page.location.idle') }}
                </Tag>
              </div>
              <div v-if="currentNode?.isUse === 1" class="detail-item">
                <span class="label">{{ $t('page.location.occupancyInfo') }}：</span>
                <span>{{ $t('page.location.holeOccupiedInfo') }}</span>
              </div>
            </div>
          </Card>
        </div>

        <!-- 当前是盒 - 显示孔位网格（不管有没有子节点） -->
        <BoxGridView
          v-else-if="currentNodeType === '盒' || currentNodeType === '冻存盒'"
          :boxes="[currentNode]"
          @select="handleChildSelect"
        />

        <!-- 当前是行 - 显示盒子列表 -->
        <GenericCardGrid
          v-else-if="currentNodeType === '行'"
          :items="children"
          :type="childType"
          @select="handleChildSelect"
        />

        <!-- 当前是架 - 显示行列表 -->
        <GenericCardGrid
          v-else-if="currentNodeType === '架' || currentNodeType === '货架'"
          :items="children"
          :type="childType"
          @select="handleChildSelect"
        />

        <!-- 当前是层 - 显示架列表 -->
        <LayerView
          v-else-if="currentNodeType === '层'"
          :layers="[currentNode]"
          @select="handleChildSelect"
        />

        <!-- 当前是冰箱 - 显示层列表 -->
        <GenericCardGrid
          v-else-if="currentNodeType === '冰箱'"
          :items="children"
          :type="childType"
          @select="handleChildSelect"
        />

        <!-- 有子节点时的其他情况 -->
        <template v-else-if="children.length > 0">
          <!-- 子节点是冰箱 - 图片卡片 -->
          <FridgeCardGrid
            v-if="childType === '冰箱'"
            :items="children"
            @select="handleChildSelect"
          />

          <!-- 子节点是层 - 层导航 -->
          <LayerView
            v-else-if="childType === '层'"
            :layers="children"
            @select="handleChildSelect"
          />

          <!-- 子节点是架 - 架矩阵 -->
          <ShelfMatrixView
            v-else-if="childType === '架'"
            :shelves="children"
            @select="handleChildSelect"
          />

          <!-- 默认通用卡片 -->
          <GenericCardGrid
            v-else
            :items="children"
            :type="childType"
            @select="handleChildSelect"
          />
        </template>

        <!-- 无子节点 -->
        <Empty v-else :description="$t('page.location.noChildContainers')" image="simple">
          <template #extra>
            <Button type="primary" @click="handleBatchCreate">
              {{ $t('page.location.batchCreate') }}
            </Button>
          </template>
        </Empty>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Breadcrumb, BreadcrumbItem, Button, Card, Empty, Tag, Tooltip, Spin } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import type { LocationApi } from '#/api';

import FridgeCardGrid from './FridgeCardGrid.vue';
import LayerView from './LayerView.vue';
import ShelfMatrixView from './ShelfMatrixView.vue';
import RowMatrixView from './RowMatrixView.vue';
import BoxGridView from './BoxGridView.vue';
import GenericCardGrid from './GenericCardGrid.vue';

const props = defineProps<{
  currentNode: LocationApi.Container | null;
  children: LocationApi.Container[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  select: [container: LocationApi.Container];
  refresh: [];
}>();

const router = useRouter();
const breadcrumb = ref<LocationApi.Container[]>([]);

// 计算当前节点类型
const currentNodeType = computed(() => {
  return props.currentNode?.locationType || '';
});

// 计算子节点类型
const childType = computed(() => {
  if (!props.children || props.children.length === 0) return '';
  return props.children[0]?.locationType || '';
});

// 获取子类型标签
const getChildTypeLabel = () => {
  const type = childType.value;
  if (!type) return '';
  return type + (props.children.length > 1 ? 's' : '');
};

// 类型颜色
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
};

const getTypeColor = (type: string) => typeColors[type] || 'default';

// 监听当前节点变化，更新面包屑
watch(() => props.currentNode, (newNode) => {
  if (newNode) {
    // 简化面包屑逻辑
    breadcrumb.value = [newNode];
  }
}, { immediate: true });

// 面包屑点击
const handleBreadcrumbClick = (item: LocationApi.Container, index: number) => {
  breadcrumb.value = breadcrumb.value.slice(0, index + 1);
  emit('select', item);
};

// 刷新
const handleRefresh = () => {
  emit('refresh');
};

// 批量创建
const handleBatchCreate = () => {
  router.push({ name: 'LocationBatchCreate' });
};

// 子容器选择
const handleChildSelect = (container: LocationApi.Container) => {
  emit('select', container);
};
</script>

<style scoped lang="less">
.smart-visualizer {
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

// 孔位详情样式
.well-detail {
  .detail-content {
    padding: 16px;
  }

  .detail-item {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    font-size: 14px;

    &:last-child {
      margin-bottom: 0;
    }

    .label {
      color: #666;
      min-width: 80px;
    }
  }
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
