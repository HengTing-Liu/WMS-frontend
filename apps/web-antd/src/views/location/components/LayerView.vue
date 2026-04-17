<template>
  <div class="layer-view">
    <!-- 左侧层导航 -->
    <div class="layer-sidebar">
      <div
        v-for="layer in layers"
        :key="layer.id"
        class="layer-item"
        :class="{ 
          active: selectedLayer?.id === layer.id,
          [getCapacityClass(layer)]: true 
        }"
        @click="selectLayer(layer)"
      >
        <div class="layer-name">{{ layer.locationName }}</div>
        <div class="layer-stats">
          <span class="capacity-text">{{ getOccupancyRate(layer) }}%</span>
        </div>
      </div>
    </div>

    <!-- 右侧架矩阵 -->
    <div class="shelf-content">
      <template v-if="selectedLayer">
        <div class="layer-title">
          {{ selectedLayer.locationName }} - {{ selectedLayer.children?.length || 0 }} 个架
        </div>
        
        <div v-if="shelves.length > 0" class="shelf-grid">
          <div
            v-for="shelf in shelves"
            :key="shelf.id"
            class="shelf-card"
            :class="getCapacityClass(shelf)"
            @click="handleShelfClick(shelf)"
          >
            <div class="shelf-name">{{ shelf.locationName }}</div>
            <div class="shelf-stats">
              {{ getOccupancyRate(shelf) }}%
            </div>
            <div class="shelf-count">
              {{ shelf.children?.length || 0 }} 行
            </div>
          </div>
        </div>
        
        <Empty v-else description="该层暂无架子" />
      </template>
      
      <Empty v-else description="请选择层" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Empty } from 'ant-design-vue';
import type { LocationApi } from '#/api';

const props = defineProps<{
  layers: LocationApi.Container[];
}>();

const emit = defineEmits<{
  select: [item: LocationApi.Container];
}>();

const selectedLayer = ref<LocationApi.Container | null>(null);

// 默认选中第一层
if (props.layers.length > 0) {
  selectedLayer.value = props.layers[0];
}

// 当前层的架子
const shelves = computed(() => {
  return selectedLayer.value?.children || [];
});

// 计算占用率
const getOccupancyRate = (item: LocationApi.Container) => {
  return Math.round(item.occupancyRate || 0);
};

// 占用率样式
const getCapacityClass = (item: LocationApi.Container) => {
  const rate = getOccupancyRate(item);
  if (rate === 0) return 'empty';
  if (rate < 50) return 'low';
  if (rate < 80) return 'medium';
  return 'high';
};

const selectLayer = (layer: LocationApi.Container) => {
  selectedLayer.value = layer;
};

const handleShelfClick = (shelf: LocationApi.Container) => {
  emit('select', shelf);
};
</script>

<style scoped lang="less">
.layer-view {
  display: flex;
  height: 100%;
  gap: 16px;
}

.layer-sidebar {
  width: 120px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 8px;
  overflow-y: auto;
}

.layer-item {
  padding: 12px;
  background: #fff;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;

  &:hover {
    border-color: #1890ff;
  }

  &.active {
    border-color: #1890ff;
    background: #e6f7ff;
  }

  .layer-name {
    font-weight: 500;
    margin-bottom: 4px;
  }

  .layer-stats {
    font-size: 12px;
    color: #666;
  }

  // 占用率颜色
  &.empty {
    border-color: #d9d9d9;
    .layer-stats { color: #999; }
  }
  &.low {
    border-color: #52c41a;
    background: #f6ffed;
  }
  &.medium {
    border-color: #faad14;
    background: #fffbe6;
  }
  &.high {
    border-color: #ff4d4f;
    background: #fff1f0;
  }
}

.shelf-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.layer-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e8e8e8;
}

.shelf-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.shelf-card {
  padding: 16px;
  background: #fff;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .shelf-name {
    font-weight: 500;
    margin-bottom: 8px;
  }

  .shelf-stats {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .shelf-count {
    font-size: 12px;
    color: #666;
  }

  // 占用率颜色
  &.empty {
    border-color: #d9d9d9;
    .shelf-stats { color: #999; }
  }
  &.low {
    border-color: #52c41a;
    background: #f6ffed;
    .shelf-stats { color: #52c41a; }
  }
  &.medium {
    border-color: #faad14;
    background: #fffbe6;
    .shelf-stats { color: #faad14; }
  }
  &.high {
    border-color: #ff4d4f;
    background: #fff1f0;
    .shelf-stats { color: #ff4d4f; }
  }
}
</style>
