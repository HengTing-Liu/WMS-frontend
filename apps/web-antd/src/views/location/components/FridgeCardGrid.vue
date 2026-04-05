<template>
  <div class="fridge-card-grid">
    <div class="grid-container">
      <div
        v-for="item in items"
        :key="item.id"
        class="fridge-card"
        :class="{ disabled: item.status === 'disabled' }"
        @click="handleClick(item)"
      >
        <!-- 图片区域 -->
        <div class="image-wrapper">
          <img 
            :src="getFridgeImage(item)" 
            :alt="item.locationName"
            class="fridge-image"
          />
          <div class="capacity-badge" :class="getCapacityClass(item)">
            {{ getOccupancyRate(item) }}%
          </div>
        </div>

        <!-- 信息区域 -->
        <div class="info-wrapper">
          <div class="name">{{ item.locationName }}</div>
          <div class="code">{{ item.locationNo }}</div>
          <div class="stats">
            <span class="capacity">
              {{ item.capacityUsed || 0 }} / {{ item.capacityTotal || 0 }}
            </span>
          </div>
        </div>

        <!-- 状态指示 -->
        <div class="status-bar" :class="getCapacityClass(item)"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LocationApi } from '#/api';

const props = defineProps<{
  items: LocationApi.Container[];
}>();

const emit = defineEmits<{
  select: [item: LocationApi.Container];
}>();

// 冰箱图片（实际项目中应该是实际图片路径）
const getFridgeImage = (item: LocationApi.Container) => {
  // 可以根据不同类型返回不同图片
  // 目前使用占位图
  return `https://placehold.co/200x280/e8e8e8/666?text=${encodeURIComponent(item.locationName || '冰箱')}`;
};

// 计算占用率
const getOccupancyRate = (item: LocationApi.Container) => {
  if (!item.capacityTotal || item.capacityTotal === 0) return 0;
  const rate = ((item.capacityUsed || 0) / item.capacityTotal) * 100;
  return Math.round(rate);
};

// 占用率样式类
const getCapacityClass = (item: LocationApi.Container) => {
  const rate = getOccupancyRate(item);
  if (rate === 0) return 'empty';
  if (rate < 50) return 'low';
  if (rate < 80) return 'medium';
  return 'high';
};

const handleClick = (item: LocationApi.Container) => {
  emit('select', item);
};
</script>

<style scoped lang="less">
.fridge-card-grid {
  height: 100%;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 8px;
}

.fridge-card {
  background: #fff;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    border-color: #1890ff;
  }

  &.disabled {
    opacity: 0.5;
    filter: grayscale(100%);
  }
}

.image-wrapper {
  position: relative;
  height: 200px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;

  .fridge-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .capacity-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    color: #fff;

    &.empty {
      background: #999;
    }
    &.low {
      background: #52c41a;
    }
    &.medium {
      background: #faad14;
    }
    &.high {
      background: #ff4d4f;
    }
  }
}

.info-wrapper {
  padding: 12px;

  .name {
    font-size: 14px;
    font-weight: 500;
    color: #1f1f1f;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 4px;
  }

  .code {
    font-size: 12px;
    color: #999;
    margin-bottom: 8px;
  }

  .stats {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    color: #666;
  }
}

.status-bar {
  height: 4px;
  background: #e8e8e8;

  &.empty {
    background: #999;
  }
  &.low {
    background: #52c41a;
  }
  &.medium {
    background: #faad14;
  }
  &.high {
    background: #ff4d4f;
  }
}
</style>
