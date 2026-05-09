<template>
  <div class="box-grid-view">
    <div v-for="box in boxes" :key="box.id" class="box-container">
      <!-- 盒标题 -->
      <div class="box-header">
        <span class="box-title">{{ box.locationName }}</span>
        <span class="box-spec">{{ box.specification }}</span>
        <span class="box-stats">
          占用: {{ getOccupancyRate(box) }}%
        </span>
      </div>

      <!-- 孔位网格 - 填满容器 -->
      <div class="grid-outer">
        <div class="grid-inner">
          <!-- 列标题 -->
          <div class="grid-row header-row">
            <div class="cell corner"></div>
            <div
              v-for="col in getGridCols(box)"
              :key="'col-' + col"
              class="cell col-header"
            >
              {{ col }}
            </div>
          </div>

          <!-- 行数据 -->
          <div
            v-for="row in getGridRows(box)"
            :key="'row-' + row"
            class="grid-row"
          >
            <div class="cell row-header">{{ row }}</div>
            <div
              v-for="col in getGridCols(box)"
              :key="row + '-' + col"
              class="cell well-cell"
              :class="getWellClass(box, row, col)"
              :title="getWellTooltip(box, row, col)"
              @click="handleWellClick(box, row, col)"
            ></div>
          </div>
        </div>
      </div>

      <!-- 图例 -->
      <div class="capacity-legend">
        <div class="legend-item">
          <span class="legend-dot occupied"></span>
          <span>已占用</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot empty"></span>
          <span>空闲</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LocationApi } from '#/api';

const props = defineProps<{
  boxes: LocationApi.Container[];
}>();

const emit = defineEmits<{
  select: [well: LocationApi.Container];
}>();

// 解析 specification
const parseSpec = (spec: string | null | undefined) => {
  if (!spec) return { rows: 4, cols: 4 };
  const match = spec.match(/(\d+)\s*x\s*(\d+)/i);
  if (match) {
    return { rows: parseInt(match[1]), cols: parseInt(match[2]) };
  }
  const numMatch = spec.match(/(\d+)/);
  if (numMatch) {
    const total = parseInt(numMatch[1]);
    if (total === 96) return { rows: 8, cols: 12 };
    if (total === 48) return { rows: 6, cols: 8 };
    if (total === 24) return { rows: 4, cols: 6 };
    if (total === 12) return { rows: 3, cols: 4 };
    if (total === 6) return { rows: 2, cols: 3 };
    if (total === 4) return { rows: 2, cols: 2 };
    if (total === 81) return { rows: 9, cols: 9 };
  }
  return { rows: 4, cols: 4 };
};

const getGridRows = (box: LocationApi.Container) => {
  const { rows } = parseSpec(box.specification);
  return Array.from({ length: rows }, (_, i) => String.fromCharCode(65 + i));
};

const getGridCols = (box: LocationApi.Container) => {
  const { cols } = parseSpec(box.specification);
  return Array.from({ length: cols }, (_, i) => i + 1);
};

const getWell = (box: LocationApi.Container, row: string, col: number) => {
  if (!box.children) return null;
  // 使用 locationName 匹配孔位坐标
  const wellNo = `${row}${col.toString().padStart(2, '0')}`;
  return box.children.find(w => w.locationName === wellNo);
};

// 判断孔位是否已占用
const isOccupied = (box: LocationApi.Container, row: string, col: number) => {
  const well = getWell(box, row, col);
  return well?.isUse === 1;
};

const getWellClass = (box: LocationApi.Container, row: string, col: number) => {
  const well = getWell(box, row, col);
  if (!well) return 'empty';
  return well.isUse === 1 ? 'occupied' : 'empty';
};

const getWellTooltip = (box: LocationApi.Container, row: string, col: number) => {
  const wellNo = `${row}${col.toString().padStart(2, '0')}`;
  const well = getWell(box, row, col);
  if (!well) return `${wellNo} - 空闲`;
  return well.isUse === 1 ? `${wellNo} - 已占用（不可点击）` : `${wellNo} - 空闲（可点击）`;
};

// 点击处理 - 已占用的孔不可点击
const handleWellClick = (box: LocationApi.Container, row: string, col: number) => {
  // 如果已占用，不触发点击
  if (isOccupied(box, row, col)) return;
  
  const well = getWell(box, row, col);
  if (well) emit('select', well);
};

const getOccupancyRate = (box: LocationApi.Container) => {
  return Math.round(box.occupancyRate || 0);
};
</script>

<style scoped lang="less">
.box-grid-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.box-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  min-height: 0; // sub-items
}

.box-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;

  .box-title {
    font-size: 15px;
    font-weight: 600;
  }

  .box-spec {
    padding: 2px 8px;
    background: #f0f5ff;
    border-radius: 4px;
    font-size: 12px;
    color: #2f54eb;
  }

  .box-stats {
    margin-left: auto;
    font-size: 12px;
    color: #666;
  }
}

// 外层容器 - 占据剩余空间
.grid-outer {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding: 8px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
}

// 内层网格 - 自适应大小
.grid-inner {
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
}

.grid-row {
  display: flex;
  gap: 2px;
  align-items: center;
}

// 单元格 - 使用vmin实现自适应
.cell {
  width: 4vmin;
  height: 4vmin;
  min-width: 20px;
  min-height: 20px;
  max-width: 40px;
  max-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(9px, 1.2vmin, 13px);
  font-weight: 500;
}

// 标题单元格
.corner {
  background: transparent;
}

.col-header,
.row-header {
  color: #666;
  font-weight: 600;
}

// 孔位单元格
.well-cell {
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: #1890ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    z-index: 1;
  }

  &.occupied {
    background: #ff4d4f;
    border-color: #ff4d4f;
    cursor: not-allowed; // 已占用不可点击

    &:hover {
      border-color: #ff4d4f;
      box-shadow: none;
    }
  }

  &.empty {
    background: #fff;
  }
}

// 图例
.capacity-legend {
  display: flex;
  gap: 20px;
  margin-top: 10px;
  padding: 8px 12px;
  background: #fafafa;
  border-radius: 4px;
  flex-shrink: 0;

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #666;

    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;

      &.occupied {
        background: #ff4d4f;
      }

      &.empty {
        background: #fff;
        border: 1px solid #d9d9d9;
      }
    }
  }
}
</style>
