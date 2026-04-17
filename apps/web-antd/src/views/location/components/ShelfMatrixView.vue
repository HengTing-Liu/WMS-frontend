<template>
  <div class="shelf-matrix-view">
    <div class="matrix-container">
      <div
        v-for="shelf in shelves"
        :key="shelf.id"
        class="shelf-row"
      >
        <!-- 架标题 -->
        <div 
          class="shelf-header"
          :class="getCapacityClass(shelf)"
          @click="handleShelfClick(shelf)"
        >
          <div class="header-name">{{ shelf.locationName }}</div>
          <div class="header-stats">{{ getOccupancyRate(shelf) }}%</div>
        </div>

        <!-- 架下的行/盒 -->
        <div v-if="shelf.children?.length" class="row-items">
          <div
            v-for="row in shelf.children"
            :key="row.id"
            class="row-card"
            :class="getCapacityClass(row)"
            @click="handleRowClick(row)"
          >
            <div class="row-name">{{ row.locationName }}</div>
            <div class="row-stats">{{ getOccupancyRate(row) }}%</div>
            
            <div v-if="row.children?.length" class="row-count">
              {{ row.children.length }} 盒
            </div>
          </div>
        </div>
        
        <div v-else class="empty-row">暂无内容</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LocationApi } from '#/api';

const props = defineProps<{
  shelves: LocationApi.Container[];
}>();

const emit = defineEmits<{
  select: [item: LocationApi.Container];
}>();

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

const handleShelfClick = (shelf: LocationApi.Container) => {
  emit('select', shelf);
};

const handleRowClick = (row: LocationApi.Container) => {
  emit('select', row);
};
</script>

<style scoped lang="less">
.shelf-matrix-view {
  height: 100%;
  overflow-y: auto;
}

.matrix-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.shelf-row {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 12px;
}

.shelf-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .header-name {
    font-size: 14px;
    font-weight: 500;
  }

  .header-stats {
    font-size: 16px;
    font-weight: 600;
  }

  // 占用率颜色
  &.empty {
    border-color: #d9d9d9;
    .header-stats { color: #999; }
  }
  &.low {
    border-color: #52c41a;
    background: #f6ffed;
    .header-stats { color: #52c41a; }
  }
  &.medium {
    border-color: #faad14;
    background: #fffbe6;
    .header-stats { color: #faad14; }
  }
  &.high {
    border-color: #ff4d4f;
    background: #fff1f0;
    .header-stats { color: #ff4d4f; }
  }
}

.row-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-left: 24px;
}

.row-card {
  width: 100px;
  padding: 12px;
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

  .row-name {
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 4px;
  }

  .row-stats {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .row-count {
    font-size: 11px;
    color: #666;
  }

  // 占用率颜色
  &.empty {
    border-color: #d9d9d9;
    .row-stats { color: #999; }
  }
  &.low {
    border-color: #52c41a;
    background: #f6ffed;
    .row-stats { color: #52c41a; }
  }
  &.medium {
    border-color: #faad14;
    background: #fffbe6;
    .row-stats { color: #faad14; }
  }
  &.high {
    border-color: #ff4d4f;
    background: #fff1f0;
    .row-stats { color: #ff4d4f; }
  }
}

.empty-row {
  padding: 16px;
  text-align: center;
  color: #999;
  font-size: 12px;
}
</style>
