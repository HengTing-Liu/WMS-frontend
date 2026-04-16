<template>
  <Modal
    v-model:open="visible"
    title="分配字段"
    :confirm-loading="loading"
    width="720px"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <Transfer
      v-model:target-keys="targetKeys"
      :data-source="dataSource"
      :titles="['未分配字段', '已分配字段']"
      :render="(item: any) => item.title"
      :list-style="{ width: '300px', height: '400px' }"
    />
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Modal, Transfer, message } from 'ant-design-vue';

import {
  batchUpdateColumnSection,
  getColumnMetaByTableId,
} from '#/api/system/columnMeta';

const props = defineProps<{
  tableCode: string;
  groupCode: string;
  groupTitle: string;
  groupType: string;
  sortOrder: number;
}>();

const emit = defineEmits<{
  success: [];
}>();

const visible = defineModel<boolean>('visible', { required: true });
const loading = ref(false);
const dataSource = ref<any[]>([]);
const targetKeys = ref<string[]>([]);
const originalTargetKeys = ref<string[]>([]);

async function loadData() {
  if (!props.tableCode) return;
  try {
    const list = await getColumnMetaByTableId(props.tableCode);
    dataSource.value = (list || []).map((item: any) => ({
      key: String(item.id),
      title: `${item.field} - ${item.title || item.columnName || item.field}`,
      description: `${item.field} - ${item.title || item.columnName || item.field}`,
      sectionKey: item.sectionKey || '',
    }));
    const orig = dataSource.value
      .filter((item) => item.sectionKey === props.groupCode)
      .map((item) => item.key);
    originalTargetKeys.value = orig;
    targetKeys.value = [...orig];
  } catch (error: any) {
    message.error(error?.message || '加载字段失败');
  }
}

watch(
  () => visible.value,
  (open) => {
    if (open) {
      originalTargetKeys.value = [];
      targetKeys.value = [];
      loadData();
    }
  },
  { immediate: true },
);

async function handleSubmit() {
  const currentTargets = new Set(targetKeys.value);
  const originalTargets = new Set(originalTargetKeys.value);

  const toAdd = targetKeys.value
    .filter((k) => !originalTargets.has(k))
    .map((k) => Number(k))
    .filter((id) => !Number.isNaN(id));
  const toRemove = originalTargetKeys.value
    .filter((k) => !currentTargets.has(k))
    .map((k) => Number(k))
    .filter((id) => !Number.isNaN(id));

  loading.value = true;
  try {
    const promises: Promise<any>[] = [];
    if (toAdd.length > 0) {
      promises.push(
        batchUpdateColumnSection({
          ids: toAdd,
          sectionKey: props.groupCode,
          sectionTitle: props.groupTitle,
          sectionOrder: props.sortOrder,
          sectionType: props.groupType || 'card',
        }),
      );
    }
    if (toRemove.length > 0) {
      promises.push(
        batchUpdateColumnSection({
          ids: toRemove,
          sectionKey: '',
          sectionTitle: '',
          sectionOrder: 0,
          sectionType: 'card',
        }),
      );
    }
    if (promises.length > 0) {
      await Promise.all(promises);
    }
    message.success('分配字段成功');
    visible.value = false;
    emit('success');
  } catch (error: any) {
    message.error(error?.message || '分配字段失败');
  } finally {
    loading.value = false;
  }
}

function handleCancel() {
  visible.value = false;
}
</script>
