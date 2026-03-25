<template>
  <div class="row-matrix-view">
    <div class="matrix-container">
      <div
        v-for="row in rows"
        :key="row.id"
        class="matrix-row"
      >
        <!-- 行标题 -->
        <div 
          class="row-header"
          :class="getCapacityClass(row)"
          @click="handleRowClick(row)"
        >
          <div class="header-name">{{ row.locationName }}</div>
          <div class="header-stats">{{ getOccupancyRate(row) }}%</div>
        </div>

        <!-- 行下的盒 -->
        <div v-if="row.children?.length" class="box-items">
          <div
            v-for="box in row.children"
            :key="box.id"
            class="box-card"
            :class="getCapacityClass(box)"
            @click="handleBoxClick(box)"
          >
            <div class="box-name">{{ box.locationName }}</div>
            <div class="box-stats">{{ getOccupancyRate(box) }}%</div>
            
            <div class="box-capacity">
              {{ box.capacityUsed || 0 }}/{{ box.capacityTotal || 0 }}
            </div>
          </div>
        </div>
        
        <div v-else class="empty-boxes">暂无冻存盒</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LocationApi } from '#/api';

const props = defineProps<{
  rows: LocationApi.Container[];
}>();

const emit = defineEmits<{
  select: [item: LocationApi.Container];
}>();

// 计算占用率
const getOccupancyRate = (item: LocationApi.Container) => {
  if (!item.capacityTotal || item.capacityTotal === 0) return 0;
  const rate = ((item.capacityUsed || 0) / item.capacityTotal) * 100;
  return Math.round(rate);
};

// 占用率样式
const getCapacityClass = (item: LocationApi.Container) => {
  const rate = getOccupancyRate(item);
  if (rate === 0) return 'empty';
  if (rate < 50) return 'low';
  if (rate < 80) return 'medium';
  return 'high';
};

const handleRowClick = (row: LocationApi.Container) => {
  emit('select', row);
};

const handleBoxClick = (box: LocationApi.Container) => {
  emit('select', box);
};
</script>

<style scoped lang="less">
.row-matrix-view {
  height: 100%;
  overflow-y: auto;
}

.matrix-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.matrix-row {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 12px;
}

.row-header {
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
  min-width: 100px;

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

.box-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-left: 24px;
}

.box-card {
  width: 80px;
  padding: 12px 8px;
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

  .box-name {
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 4px;
  }

  .box-stats {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .box-capacity {
    font-size: 10px;
    color: #666;
  }

  // 占用率颜色
  &.empty {
    border-color: #d9d9d9;
    .box-stats { color: #999; }
  }
  &.low {
    border-color: #52c41a;
    background: #f6ffed;
    .box-stats { color: #52c41a; }
  }
  &.medium {
    border-color: #faad14;
    background: #fffbe6;
    .box-stats { color: #faad14; }
  }
  &.high {
    border-color: #ff4d4f;
    background: #fff1f0;
    .box-stats { color: #ff4d4f; }
  }
}

.empty-boxes {
  padding: 16px;
  text-align: center;
  color: #999;
  font-size: 12px;
}
</style>
