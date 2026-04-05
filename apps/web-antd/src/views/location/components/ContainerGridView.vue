<template>
  <div class="container-grid-view">
    <div v-if="containers.length === 0" class="empty-state">
      <Empty :description="$t('page.location.noChildContainers')" image="simple">
        <template #extra>
          <p class="hint">{{ $t('page.location.clickBatchCreate') }}</p>
        </template>
      </Empty>
    </div>

    <div v-else class="container-grid">
      <div
        v-for="container in containers"
        :key="container.id"
        class="container-card"
        :class="[
          `type-${container.type}`,
          { 'disabled': container.status === 'disabled' }
        ]"
        @click="handleClick(container)"
      >
        <!-- 卡片头部 -->
        <div class="card-header">
          <div class="icon-wrapper">
            <IconifyIcon :icon="getContainerIcon(container.type)" class="type-icon" />
          </div>
          <div class="title-wrapper">
            <div class="name">{{ container.name }}</div>
            <div class="code">{{ container.code }}</div>
          </div>
          <div class="status-badge" :class="container.status">
            {{ container.status === 'enabled' ? $t('page.common.enabled') : $t('page.common.disabled') }}
          </div>
        </div>

        <!-- 容量信息 -->
        <div v-if="hasCapacityInfo(container)" class="capacity-bar">
          <div class="capacity-header">
            <span class="label">{{ $t('page.location.capacity') }}</span>
            <span class="value">{{ container.usedCapacity || 0 }} / {{ container.capacity }}</span>
          </div>
          <div class="capacity-progress">
            <div
              class="progress-fill"
              :style="{
                width: `${getOccupancyRate(container)}%`,
                backgroundColor: getOccupancyColor(getOccupancyRate(container))
              }"
            />
          </div>
        </div>

        <!-- 统计信息 -->
        <div class="stats-row">
          <div v-if="container.children?.length" class="stat">
            <IconifyIcon icon="material-symbols:folder" />
            <span>{{ container.children.length }} {{ $t('page.location.type.box') }}</span>
          </div>
          <div v-if="container.gridConfig?.length" class="stat">
            <IconifyIcon icon="material-symbols:grid-view" />
            <span>{{ container.gridConfig.length }} {{ $t('page.location.gridConfig') }}</span>
          </div>
        </div>

        <!-- 快捷操作 -->
        <div class="quick-actions" @click.stop>
          <Button
            v-if="canEnter(container.type)"
            type="link"
            size="small"
            @click="handleEnter(container)"
          >
            <IconifyIcon icon="material-symbols:arrow-forward" />
            {{ $t('page.location.enter') }}
          </Button>
        </div>
      </div>
    </div>

    <!-- 图例 -->
    <div class="legend-bar">
      <span class="legend-title">{{ $t('page.location.legend.low').split(' ')[0] }}：</span>
      <div class="legend-item">
        <span class="dot low"></span>
        <span>{{ $t('page.location.legend.low') }}</span>
      </div>
      <div class="legend-item">
        <span class="dot medium"></span>
        <span>{{ $t('page.location.legend.medium') }}</span>
      </div>
      <div class="legend-item">
        <span class="dot high"></span>
        <span>{{ $t('page.location.legend.high') }}</span>
      </div>
      <div class="legend-item">
        <span class="dot full"></span>
        <span>{{ $t('page.location.legend.full') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Empty, Button } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import type { LocationApi } from '#/api';

const props = defineProps<{
  containers: LocationApi.Container[];
  parentType?: string;
}>();

const emit = defineEmits<{
  select: [container: LocationApi.Container];
}>();

// 图标映射
const iconMap: Record<string, string> = {
  warehouse: 'material-symbols:warehouse',
  area: 'material-symbols:map',
  shelf: 'material-symbols:shelves',
  slot: 'material-symbols:grid-view',
  box: 'material-symbols:box',
};

const getContainerIcon = (type: string) => {
  return iconMap[type] || 'material-symbols:folder';
};

// 是否有容量信息
const hasCapacityInfo = (container: LocationApi.Container) => {
  return container.capacity !== undefined && container.capacity > 0;
};

// 计算占用率
const getOccupancyRate = (container: LocationApi.Container) => {
  if (!container.capacity) return 0;
  const rate = ((container.usedCapacity || 0) / container.capacity) * 100;
  return Math.min(Math.round(rate), 100);
};

// 占用率颜色
const getOccupancyColor = (rate: number) => {
  if (rate >= 95) return '#ff4d4f';
  if (rate >= 80) return '#faad14';
  if (rate >= 50) return '#1890ff';
  return '#52c41a';
};

// 是否可以进入（有子级）
const canEnter = (type: string) => {
  return type !== 'box';
};

// 点击容器
const handleClick = (container: LocationApi.Container) => {
  emit('select', container);
};

// 进入容器
const handleEnter = (container: LocationApi.Container) => {
  emit('select', container);
};
</script>

<style scoped lang="less">
.container-grid-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;

  .hint {
    color: #999;
    margin-top: 8px;
  }
}

.container-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  padding-bottom: 16px;
}

.container-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #1890ff;
    transform: translateY(-2px);
  }

  &.disabled {
    opacity: 0.6;
    background: #f5f5f5;
  }

  // 类型边框色
  &.type-warehouse {
    border-left: 4px solid #1890ff;
  }

  &.type-area {
    border-left: 4px solid #13c2c2;
  }

  &.type-shelf {
    border-left: 4px solid #722ed1;
  }

  &.type-slot {
    border-left: 4px solid #fa8c16;
  }

  &.type-box {
    border-left: 4px solid #52c41a;
  }
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 12px;

  .icon-wrapper {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: #f0f5ff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .type-icon {
      font-size: 24px;
      color: #1890ff;
    }
  }

  .title-wrapper {
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
  }

  .status-badge {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
    flex-shrink: 0;

    &.enabled {
      background: #f6ffed;
      color: #52c41a;
    }

    &.disabled {
      background: #fff1f0;
      color: #ff4d4f;
    }
  }
}

.capacity-bar {
  margin-bottom: 12px;

  .capacity-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
    font-size: 12px;

    .label {
      color: #666;
    }

    .value {
      color: #333;
      font-weight: 500;
    }
  }

  .capacity-progress {
    height: 6px;
    background: #f0f0f0;
    border-radius: 3px;
    overflow: hidden;

    .progress-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s;
    }
  }
}

.stats-row {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;

  .stat {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #666;

    :deep(svg) {
      font-size: 14px;
    }
  }
}

.quick-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.legend-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: #fafafa;
  border-top: 1px solid #e8e8e8;
  margin-top: auto;
  border-radius: 0 0 8px 8px;

  .legend-title {
    font-weight: 500;
    color: #666;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #666;

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;

      &.low {
        background: #52c41a;
      }

      &.medium {
        background: #1890ff;
      }

      &.high {
        background: #faad14;
      }

      &.full {
        background: #ff4d4f;
      }
    }
  }
}
</style>
