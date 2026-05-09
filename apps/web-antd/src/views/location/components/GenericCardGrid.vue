<template>
  <div class="generic-card-grid">
    <div class="type-label">{{ type }} ({{ items.length }})</div>
    
    <div class="grid-container">
      <div
        v-for="item in items"
        :key="item.id"
        class="generic-card"
        :class="getCapacityClass(item)"
        @click="handleClick(item)"
      >
        <div class="card-icon">
          <IconifyIcon :icon="getItemIcon(item)" />
        </div>
        
        <div class="card-info">
          <div class="name">{{ item.locationName }}</div>
          <div class="stats">
            <span v-if="item.occupancyRate !== undefined">
              {{ getOccupancyRate(item) }}%
            </span>
            <span v-else-if="item.children?.length">
              {{ item.children.length }} {{ $t('page.location.subItems') }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconifyIcon } from '@vben/icons';
import type { LocationApi } from '#/api';

const props = defineProps<{
  items: LocationApi.Container[];
  type: string;
}>();

const emit = defineEmits<{
  select: [item: LocationApi.Container];
}>();

// icon mapping
const iconMap: Record<string, string> = {
  '冰箱': 'material-symbols:kitchen',
  '房间': 'material-symbols:meeting-room',
  '层': 'material-symbols:stack',
  '库区': 'material-symbols:warehouse',
  '架': 'material-symbols:shelves',
  '货架': 'material-symbols:shelves',
  '行': 'material-symbols:table-rows',
  '货位': 'material-symbols:grid-view',
  '盒': 'material-symbols:box',
  '冻存盒': 'material-symbols:box',
  '孔': 'material-symbols:circle',
  'warehouse': 'material-symbols:warehouse',
  'area': 'material-symbols:map',
  'shelf': 'material-symbols:shelves',
  'slot': 'material-symbols:grid-view',
  'box': 'material-symbols:box',
};

const getItemIcon = (item: LocationApi.Container) => {
  return iconMap[item.locationType] || 'material-symbols:folder';
};

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

const handleClick = (item: LocationApi.Container) => {
  emit('select', item);
};
</script>

<style scoped lang="less">
.generic-card-grid {
  height: 100%;
}

.type-label {
  font-size: 14px;
  font-weight: 500;
  color: #666;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e8e8e8;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.generic-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fff;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .card-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f0f5ff;
    border-radius: 8px;
    
    :deep(svg) {
      font-size: 24px;
      color: #1890ff;
    }
  }

  .card-info {
    flex: 1;
    min-width: 0;

    .name {
      font-size: 14px;
      font-weight: 500;
      color: #1f1f1f;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .code {
      font-size: 12px;
      color: #999;
      margin-top: 2px;
    }

    .stats {
      font-size: 11px;
      color: #666;
      margin-top: 4px;
    }
  }

  // 占用率颜色
  &.empty {
    border-color: #d9d9d9;
    .card-icon { background: #f5f5f5; }
  }
  &.low {
    border-color: #52c41a;
    .card-icon { background: #f6ffed; }
  }
  &.medium {
    border-color: #faad14;
    .card-icon { background: #fffbe6; }
  }
  &.high {
    border-color: #ff4d4f;
    .card-icon { background: #fff1f0; }
  }
}
</style>
