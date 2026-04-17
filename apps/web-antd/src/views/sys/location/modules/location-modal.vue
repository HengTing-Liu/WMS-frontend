<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Button, Modal, Form, Input, Select, Switch, Tree, message } from 'ant-design-vue';
import type { TreeDataItem } from 'ant-design-vue';
import {
  createLocationWithParent,
  updateLocationById,
  getLocationTree,
  listWarehouseSimple,
  suggestLocationCode,
  type LocationTreeNode,
} from '#/api/sys/location';
import { listWarehouseSimpleForLocation } from '#/api/sys/warehouse';
import { $t } from '@vben/locales';

const props = defineProps<{
  visible: boolean;
  mode: 'add' | 'edit';
  record: LocationTreeNode | null;
  warehouseOptions: Array<{ label: string; value: string }>;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  'success': [];
}>();

const loading = ref(false);
const formRef = ref();
const warehouseLoading = ref(false);
const modalWarehouseOptions = ref<Array<{ label: string; value: string }>>([]);

const formState = ref({
  warehouseCode: '' as string | undefined,
  parentId: undefined as number | undefined,
  locationName: '',
  locationType: undefined as string | undefined,
  storageMode: undefined as string | undefined,
  specification: '',
  remarks: '',
});

// 加载仓库下拉数据（用于弹窗内的仓库选择）
async function loadModalWarehouseOptions() {
  warehouseLoading.value = true;
  try {
    modalWarehouseOptions.value = await listWarehouseSimpleForLocation();
  } catch {
    modalWarehouseOptions.value = [];
  } finally {
    warehouseLoading.value = false;
  }
}

const locationTypeOptions = [
  { label: $t('page.wms.location.locationTypeOptions.STORAGE'), value: 'STORAGE' },
  { label: $t('page.wms.location.locationTypeOptions.PICK'), value: 'PICK' },
  { label: $t('page.wms.location.locationTypeOptions.COLLECT'), value: 'COLLECT' },
  { label: $t('page.wms.location.locationTypeOptions.RETURN'), value: 'RETURN' },
];

const storageModeOptions = [
  { label: $t('page.wms.location.storageModeOptions.EXCLUSIVE'), value: 'Exclusive' },
  { label: $t('page.wms.location.storageModeOptions.SHARED'), value: 'Shared' },
];

const title = computed(() => (props.mode === 'add' ? $t('page.wms.location.addTitle') : $t('page.wms.location.editTitle')));

const rules = {
  warehouseCode: [{ required: true, message: $t('page.wms.location.warehouseRequired'), trigger: 'change' }],
  locationName: [{ required: true, message: $t('page.wms.location.locationNameRequired'), trigger: 'blur' }],
  locationType: [{ required: true, message: $t('page.wms.location.locationTypeRequired'), trigger: 'change' }],
};



// 父级库位树（用于新增时选择父节点）
const parentTreeLoading = ref(false);
const parentTreeData = ref<LocationTreeNode[]>([]);

watch(
  () => props.visible,
  async (val) => {
    if (val) {
      if (props.mode === 'edit' && props.record) {
        formState.value = {
          warehouseCode: props.record.warehouseCode || '',
          parentId: props.record.parentId,
          locationName: props.record.locationName || '',
          locationType: props.record.locationType,
          storageMode: props.record.storageMode,
          specification: props.record.specification || '',
          remarks: props.record.remarks || '',
        };
      } else {
        // 新增模式：加载父级库位树
        formState.value = {
          warehouseCode: props.warehouseOptions?.[0]?.value ?? '',
          parentId: undefined,
          locationName: '',
          locationType: undefined,
          storageMode: undefined,
          specification: '',
          remarks: '',
        };
        await loadModalWarehouseOptions();
        await loadParentTree();
      }
    }
  }
);

async function loadParentTree() {
  if (!formState.value.warehouseCode) {
    parentTreeData.value = [];
    return;
  }
  parentTreeLoading.value = true;
  try {
    const nodes = await getLocationTree({ warehouseCode: formState.value.warehouseCode });
    parentTreeData.value = nodes;
  } catch {
    parentTreeData.value = [];
  } finally {
    parentTreeLoading.value = false;
  }
}

// 仓库切换时重新加载父级树
watch(
  () => formState.value.warehouseCode,
  () => {
    if (props.mode === 'add' && props.visible) {
      formState.value.parentId = undefined;
      loadParentTree();
    }
  }
);

function buildTreeForAntTree(nodes: LocationTreeNode[], parentId: number | undefined): TreeDataItem[] {
  return nodes
    .filter((n) => n.parentId === parentId)
    .map((n) => ({
      title: n.locationName,
      key: n.id,
      id: n.id,
      dataRef: n,
      children: n.hasChildren ? undefined : buildTreeForAntTree(nodes, n.id),
    }));
}

const antTreeData = computed(() => buildTreeForAntTree(parentTreeData.value, undefined));

function handleClose() {
  emit('update:visible', false);
}

async function handleSubmit() {
  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  loading.value = true;
  try {
    const data = { ...formState.value };
    if (props.mode === 'add') {
      await createLocationWithParent(data);
      message.success($t('page.message.addSuccess'));
    } else {
      await updateLocationById(props.record!.id!, data);
      message.success($t('page.message.updateSuccess'));
    }
    emit('success');
    handleClose();
  } catch (error: any) {
    message.error(error?.message || $t('page.message.saveFail'));
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Modal
    :open="visible"
    :title="title"
    :confirm-loading="loading"
    width="600px"
    :ok-text="$t('page.common.confirm')"
    :cancel-text="$t('page.common.cancel')"
    @ok="handleSubmit"
    @cancel="handleClose"
  >
    <Form
      ref="formRef"
      :model="formState"
      :rules="rules"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 16 }"
    >
      <Form.Item :label="$t('page.wms.location.warehouse')" name="warehouseCode">
        <Select
          v-model:value="formState.warehouseCode"
          :placeholder="$t('page.wms.location.warehousePlaceholder')"
          :options="warehouseOptions"
          :disabled="mode === 'edit'"
          @change="loadParentTree"
        />
      </Form.Item>

      <Form.Item :label="$t('page.wms.location.parentLocation')" name="parentId">
        <Tree
          v-model:selected-keys="formState.parentId"
          :tree-data="antTreeData"
          :load-data="() => Promise.resolve()"
          :disabled="mode === 'edit'"
          :selectable="true"
          :show-icon="true"
          :show-line="{ showLeafIcon: false }"
          :placeholder="$t('page.wms.location.parentLocationPlaceholder')"
          style="max-height: 200px; overflow-y: auto; border: 1px solid #d9d9d9; border-radius: 6px; padding: 4px"
          @select="(keys: any[]) => { formState.parentId = keys[0]; }"
        >
          <template #icon>
            <span style="font-size: 12px">📁</span>
          </template>
          <template #title="{ dataRef }">
            {{ dataRef.locationName }}
          </template>
        </Tree>
        <div style="font-size: 12px; color: #999; margin-top: 4px">
          {{ $t('page.wms.location.parentLocationTip') }}
        </div>
      </Form.Item>

      <Form.Item :label="$t('page.wms.location.locationName')" name="locationName">
        <Input v-model:value="formState.locationName" :placeholder="$t('page.wms.location.locationNamePlaceholder')" />
      </Form.Item>

      <Form.Item :label="$t('page.wms.location.locationType')" name="locationType">
        <Select
          v-model:value="formState.locationType"
          :placeholder="$t('page.wms.location.locationTypePlaceholder')"
          :options="locationTypeOptions"
          allow-clear
        />
      </Form.Item>

      <Form.Item :label="$t('page.wms.location.storageMode')" name="storageMode">
        <Select
          v-model:value="formState.storageMode"
          :placeholder="$t('page.wms.location.storageModePlaceholder')"
          :options="storageModeOptions"
          allow-clear
        />
      </Form.Item>

      <Form.Item :label="$t('page.wms.location.specification')" name="specification">
        <Input v-model:value="formState.specification" :placeholder="$t('page.wms.location.specificationPlaceholder')" />
      </Form.Item>

      <Form.Item :label="$t('page.common.remark')" name="remarks">
        <Input.TextArea v-model:value="formState.remarks" :placeholder="$t('page.common.remarkPlaceholder')" :rows="3" />
      </Form.Item>
    </Form>
  </Modal>
</template>

<style scoped>
</style>
