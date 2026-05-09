<template>
  <Modal
    v-model:open="visible"
    title="预览：存储容器及孔位"
    :footer="null"
    width="700px"
  >
    <Alert
      :message="`将创建 ${containers.length} 个容器${positions.length > 0 ? '，共 ' + positions.length + ' 个孔位' : ''}`"
      type="info"
      show-icon
      class="mb-4"
    />

    <div class="preview-container">
      <template v-if="positions.length > 0">
        <!-- 独占模式：显示容器树形结构 -->
        <div v-for="container in containers" :key="container.id || container.locationName" class="container-item">
          <div class="container-header">
            <IconifyIcon icon="material-symbols:box" class="text-lg mr-2" />
            <span class="font-medium">{{ container.locationName }}</span>
            <span class="text-gray-400 text-sm ml-2">{{ container.locationSortNo }}</span>
          </div>
          <div class="positions-grid">
            <Tag
              v-for="pos in getContainerPositions(container.id || container.locationName)"
              :key="pos.locationName"
              color="blue"
            >
              {{ pos.locationName }}
            </Tag>
          </div>
        </div>
      </template>

      <template v-else>
        <!-- 共享模式：仅显示容器列表 -->
        <div class="container-list">
          <Tag
            v-for="container in containers"
            :key="container.id || container.locationName"
            color="green"
            class="m-1"
          >
            <IconifyIcon icon="material-symbols:box" class="mr-1" />
            {{ container.locationName }}
          </Tag>
        </div>
        <Alert message="共享模式不生成孔位" type="default" show-icon class="mt-4" />
      </template>
    </div>

    <!-- 网格预览（独占模式） -->
    <template v-if="positions.length > 0 && gridRows > 0">
      <Divider>网格预览（首个容器）</Divider>
      <div class="grid-preview">
        <div
          v-for="row in gridRows"
          :key="row"
          class="grid-row"
        >
          <div
            v-for="col in gridCols"
            :key="col"
            class="grid-cell"
            :class="{ 'occupied': false }"
            :title="`${String.fromCharCode(64 + row)}${String(col).padStart(2, '0')}`"
          >
            {{ String.fromCharCode(64 + row) }}{{ String(col).padStart(2, '0') }}
          </div>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  Alert,
  Divider,
  Modal,
  Tag,
} from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';

interface ContainerInfo {
  id?: number;
  locationName: string;
  locationSortNo?: string;
}

interface PositionInfo {
  id?: number;
  parentId?: number;
  locationName: string;
}

interface Props {
  visible: boolean;
  containers: ContainerInfo[];
  positions: PositionInfo[];
  specification?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void;
}>();

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
});

// 首个容器的规格（用于网格预览）
const gridRows = computed(() => {
  if (!props.specification) return 0;
  const [rows] = props.specification.split('x').map(Number);
  return rows || 0;
});

const gridCols = computed(() => {
  if (!props.specification) return 0;
  const [, cols] = props.specification.split('x').map(Number);
  return cols || 0;
});

// 根据容器ID获取其下的孔位
function getContainerPositions(containerKey: string | number): PositionInfo[] {
  const containerId = typeof containerKey === 'string' ? parseInt(containerKey.replace('TMP', '')) - 100 : containerKey;
  return props.positions.filter(p => p.parentId === containerId).slice(0, 20);
}
</script>

<style scoped>
.preview-container {
  max-height: 400px;
  overflow-y: auto;
}

.container-item {
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
}

.container-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e8e8e8;
}

.container-list {
  display: flex;
  flex-wrap: wrap;
}

.positions-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding-left: 24px;
}

.grid-preview {
  display: inline-block;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 8px;
  background: #fafafa;
}

.grid-row {
  display: flex;
}

.grid-cell {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e8e8e8;
  margin: 1px;
  background: #fff;
  border-radius: 2px;
  font-size: 11px;
  color: #666;
  cursor: default;
}

.grid-cell:hover {
  background: #e6f7ff;
  border-color: #1890ff;
}
</style>