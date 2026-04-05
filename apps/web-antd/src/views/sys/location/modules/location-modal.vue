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

const formState = ref({
  warehouseCode: '' as string | undefined,
  parentId: undefined as number | undefined,
  locationNo: '',
  locationName: '',
  locationType: undefined as string | undefined,
  storageMode: undefined as string | undefined,
  specification: '',
  remarks: '',
});

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
  locationNo: [{ required: true, message: $t('page.wms.location.locationNoRequired'), trigger: 'blur' }],
  locationName: [{ required: true, message: $t('page.wms.location.locationNameRequired'), trigger: 'blur' }],
  locationType: [{ required: true, message: $t('page.wms.location.locationTypeRequired'), trigger: 'change' }],
};

// 自动生成编码
const autoGeneratingCode = ref(false);
const parentPathCache = ref<Record<number, string>>({});

function getParentPath(): string {
  if (!formState.value.parentId) return '';
  return parentPathCache.value[formState.value.parentId] || '';
}

async function handleSuggestCode() {
  if (!formState.value.warehouseCode) {
    message.warning($t('page.wms.location.suggestCodeTip'));
    return;
  }
  autoGeneratingCode.value = true;
  try {
    const result = await suggestLocationCode({
      warehouseCode: formState.value.warehouseCode,
      parentId: formState.value.parentId,
      locationType: formState.value.locationType,
    });
    if (result.suggestedCode) {
      formState.value.locationNo = result.suggestedCode;
      // 缓存父节点路径
      if (result.fullPath) {
        parentPathCache.value[formState.value.parentId!] = result.fullPath;
      }
      message.success(
        $t('page.wms.location.suggestCodeSuccess', {
          code: result.suggestedCode,
          level: result.currentLevel,
        })
      );
    }
  } catch {
    message.error($t('page.wms.location.suggestCodeFailed'));
  } finally {
    autoGeneratingCode.value = false;
  }
}

// 监听关键字段变化，自动重新生成编码
watch(
  [() => formState.value.warehouseCode, () => formState.value.parentId, () => formState.value.locationType],
  async ([newWarehouse, newParentId, newType]) => {
    if (props.mode === 'add' && props.visible && newWarehouse && newType) {
      // 防抖延迟，避免频繁请求
      await new Promise((resolve) => setTimeout(resolve, 300));
      // 仅当用户尚未手动修改编码时才自动更新
      if (!formState.value.locationNo || formState.value.locationNo === formState.value._lastGenerated) {
        await handleSuggestCode();
      }
    }
  }
);

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
          locationNo: props.record.locationNo || '',
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
          locationNo: '',
          locationName: '',
          locationType: undefined,
          storageMode: undefined,
          specification: '',
          remarks: '',
        };
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
          v-model:selected-keys="[formState.parentId]"
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
            {{ dataRef.locationName }} ({{ dataRef.locationNo }})
          </template>
        </Tree>
        <div style="font-size: 12px; color: #999; margin-top: 4px">
          {{ $t('page.wms.location.parentLocationTip') }}
        </div>
      </Form.Item>

      <Form.Item :label="$t('page.wms.location.locationNo')" name="locationNo">
        <div class="location-no-input-group">
          <Input
            v-model:value="formState.locationNo"
            :placeholder="$t('page.wms.location.locationNoPlaceholder')"
            :disabled="mode === 'edit'"
            class="location-no-input"
          />
          <Button
            v-if="mode === 'add'"
            :loading="autoGeneratingCode"
            size="small"
            @click="handleSuggestCode"
          >
            {{ $t('page.wms.location.autoGenerate') }}
          </Button>
        </div>
        <div v-if="formState.locationNo && formState.parentId" class="location-no-hint">
          {{ $t('page.wms.location.parentPath') }}: {{ getParentPath() }}
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
.location-no-input-group {
  display: flex;
  gap: 8px;
  align-items: center;
}
.location-no-input {
  flex: 1;
}
.location-no-hint {
  font-size: 12px;
  color: var(--text-color-secondary, #999);
  margin-top: 4px;
  line-height: 1.4;
  word-break: break-all;
}
</style>
