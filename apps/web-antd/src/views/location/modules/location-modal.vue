<template>
  <Modal
    :title="isEdit ? $t('page.location.editTitle') : $t('page.location.addTitle')"
    v-model:open="visible"
    :confirm-loading="loading"
    @ok="handleSubmit"
    @cancel="handleCancel"
    width="600px"
  >
    <Form
      ref="formRef"
      :model="formData"
      :rules="rules"
      :label-col="{ span: 5 }"
      :wrapper-col="{ span: 18 }"
    >
      <!-- 父节点 -->
      <FormItem :label="$t('page.location.parentNode')" name="parentId">
        <TreeSelect
          v-model:value="formData.parentId"
          :tree-data="locationTreeSelectData"
          :field-names="{ label: 'locationName', value: 'id', children: 'children' }"
          :placeholder="$t('page.location.parentNodePlaceholder')"
          allow-clear
          tree-default-expand-all
          style="width: 100%"
          :disabled="isEdit || !!initialParentId"
        />
      </FormItem>

      <!-- 库位名称 -->
      <FormItem :label="$t('page.location.containerName')" name="locationName">
        <Input
          v-model:value="formData.locationName"
          :placeholder="$t('page.location.containerNamePlaceholder')"
          :max-length="50"
          show-count
        />
      </FormItem>

      <!-- 库位编码 -->
      <FormItem :label="$t('page.location.containerCode')" name="locationNo">
        <Input
          v-model:value="formData.locationNo"
          :placeholder="$t('page.location.containerCodePlaceholder')"
          :max-length="50"
          show-count
        />
      </FormItem>

      <!-- 库位类型 -->
      <FormItem :label="$t('page.location.containerType')" name="locationType">
        <Select
          v-model:value="formData.locationType"
          :placeholder="$t('page.location.selectType')"
          :disabled="isEdit"
          @change="handleTypeChange"
        >
          <SelectOption v-for="opt in availableTypes" :key="opt.value" :value="opt.value">
            <div class="type-option">
              <IconifyIcon :icon="opt.icon" />
              <span>{{ opt.label }}</span>
            </div>
          </SelectOption>
        </Select>
      </FormItem>

      <!-- 容量 -->
      <FormItem v-if="showCapacity" :label="$t('page.location.capacity')" name="capacity">
        <InputNumber
          v-model:value="formData.capacity"
          :min="0"
          :precision="0"
          style="width: 100%"
          :placeholder="$t('page.location.capacity')"
        />
      </FormItem>

      <!-- 尺寸 -->
      <template v-if="showDimensions">
        <FormItem :label="$t('page.location.length') + ' (cm)'" name="length">
          <InputNumber v-model:value="formData.length" :min="0" :precision="2" style="width: 100%" />
        </FormItem>
        <FormItem :label="$t('page.location.width') + ' (cm)'" name="width">
          <InputNumber v-model:value="formData.width" :min="0" :precision="2" style="width: 100%" />
        </FormItem>
        <FormItem :label="$t('page.location.height') + ' (cm)'" name="height">
          <InputNumber v-model:value="formData.height" :min="0" :precision="2" style="width: 100%" />
        </FormItem>
      </template>

      <!-- 网格配置（仅最后一级类型） -->
      <template v-if="isLastLevelType">
        <FormItem :label="$t('page.location.gridRows')" name="gridRows">
          <InputNumber v-model:value="formData.gridRows" :min="1" :max="26" style="width: 100%" />
        </FormItem>
        <FormItem :label="$t('page.location.gridCols')" name="gridCols">
          <InputNumber v-model:value="formData.gridCols" :min="1" :max="50" style="width: 100%" />
        </FormItem>
      </template>

      <!-- 状态 -->
      <FormItem :label="$t('page.common.status')" name="status">
        <RadioGroup v-model:value="formData.status">
          <Radio value="enabled">{{ $t('page.common.enabled') }}</Radio>
          <Radio value="disabled">{{ $t('page.common.disabled') }}</Radio>
        </RadioGroup>
      </FormItem>

      <!-- 描述 -->
      <FormItem :label="$t('page.location.description')" name="description">
        <Textarea
          v-model:value="formData.description"
          :rows="3"
          :placeholder="$t('page.location.description')"
          :max-length="200"
          show-count
        />
      </FormItem>
    </Form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import {
  Modal,
  Form,
  FormItem,
  Input,
  InputNumber,
  Radio,
  RadioGroup,
  Select,
  SelectOption,
  Textarea,
  TreeSelect,
  message,
} from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { createLocation, updateLocation, getLocationDetail, type LocationApi } from '#/api';

interface Props {
  locationTree: LocationApi.Container[];
}

const props = defineProps<Props>();

const visible = ref(false);
const loading = ref(false);
const isEdit = ref(false);
const formRef = ref();
const initialParentId = ref<string | null>(null);

const formData = reactive<Partial<LocationApi.Container>>({
  id: undefined,
  parentId: null,
  locationName: '',
  locationNo: '',
  locationType: 'warehouse',
  status: 'enabled',
  capacity: undefined,
  length: undefined,
  width: undefined,
  height: undefined,
  gridRows: 8,
  gridCols: 12,
  description: '',
});

// 图标映射
const iconMap: Record<string, string> = {
  warehouse: 'material-symbols:warehouse',
  area: 'material-symbols:map',
  shelf: 'material-symbols:shelves',
  slot: 'material-symbols:grid-view',
  box: 'material-symbols:box',
};

// 容器类型数据（静态配置）
const containerTypeEnum = ref<Array<{ value: string; label: string; icon: string; sortOrder: number }>>([
  { value: 'warehouse', label: $t('page.location.locationType.warehouse'), icon: iconMap.warehouse, sortOrder: 1 },
  { value: 'area', label: $t('page.location.locationType.area'), icon: iconMap.area, sortOrder: 2 },
  { value: 'shelf', label: $t('page.location.locationType.shelf'), icon: iconMap.shelf, sortOrder: 3 },
  { value: 'slot', label: $t('page.location.locationType.slot'), icon: iconMap.slot, sortOrder: 4 },
  { value: 'box', label: $t('page.location.locationType.box'), icon: iconMap.box, sortOrder: 5 },
]);

// 类型层级顺序
const typeOrder = ref<string[]>(['warehouse', 'area', 'shelf', 'slot', 'box']);

// 类型选项
const typeOptions = computed(() => containerTypeEnum.value);

// 转换树数据，添加根节点选项
const locationTreeSelectData = computed(() => {
  return [
    { id: 'root', locationName: $t('page.location.root'), children: props.locationTree },
  ];
});

// 根据父节点类型过滤可用类型
const availableTypes = computed(() => {
  const parentId = formData.parentId;
  if (!parentId) {
    // 根节点只能创建仓库
    return typeOptions.value.filter((t) => t.value === 'warehouse');
  }

  // 查找父节点类型
  const findParent = (nodes: LocationApi.Container[]): LocationApi.Container | null => {
    for (const node of nodes) {
      if (node.id === parentId) return node;
      if (node.children) {
        const found = findParent(node.children);
        if (found) return found;
      }
    }
    return null;
  };

  const parent = findParent(props.locationTree);
  if (!parent) return typeOptions.value;

  const parentIndex = typeOrder.value.indexOf(parent.locationType);
  if (parentIndex === -1 || parentIndex === typeOrder.value.length - 1) {
    return [];
  }

  // 只能创建下一级的类型
  const nextType = typeOrder.value[parentIndex + 1];
  return typeOptions.value.filter((t) => t.value === nextType);
});

// 是否显示容量 - 除了第一级类型，其他都显示
const showCapacity = computed(() => {
  const keys = typeOrder.value;
  const currentType = formData.locationType;
  return keys.indexOf(currentType || '') > 0;
});

// 是否显示尺寸 - 除了最后一级类型，其他都显示
const showDimensions = computed(() => {
  const keys = typeOrder.value;
  const currentType = formData.locationType;
  return keys.indexOf(currentType || '') < keys.length - 1;
});

// 是否为最后一级类型（显示网格配置）
const isLastLevelType = computed(() => {
  const keys = typeOrder.value;
  const currentType = formData.locationType;
  return keys.indexOf(currentType || '') === keys.length - 1;
});

// 表单校验规则
const rules = computed(() => ({
  locationName: [
    { required: true, message: $t('page.location.locationNameRequired'), trigger: 'blur' },
    { min: 1, max: 50, message: $t('page.location.locationNameLength'), trigger: 'blur' },
  ],
  locationNo: [
    { required: true, message: $t('page.location.locationNoRequired'), trigger: 'blur' },
    { min: 1, max: 50, message: $t('page.location.locationNoLength'), trigger: 'blur' },
  ],
  locationType: [{ required: true, message: $t('page.location.locationTypeRequired'), trigger: 'change' }],
}));

const emit = defineEmits<{
  (e: 'success'): void;
}>();

// 打开弹窗
const open = async (row?: any) => {
  visible.value = true;
  isEdit.value = !!row?.id;
  initialParentId.value = row?.parentId || null;

  // 重置表单
  Object.assign(formData, {
    id: undefined,
    parentId: row?.parentId || null,
    locationName: '',
    locationNo: '',
    locationType: availableTypes.value[0]?.value || typeOrder.value[0] || '',
    status: 'enabled',
    capacity: undefined,
    length: undefined,
    width: undefined,
    height: undefined,
    gridRows: 8,
    gridCols: 12,
    description: '',
  });

  if (isEdit.value && row?.id) {
    try {
      loading.value = true;
      const res = await getLocationDetail(row.id);
      if (res) {
        Object.assign(formData, {
          id: res.id,
          parentId: res.parentId || null,
          locationName: res.locationName || '',
          locationNo: res.locationNo || '',
          locationType: res.locationType || typeOrder.value[0] || '',
          status: res.status || 'enabled',
          capacity: res.capacity,
          length: res.length,
          width: res.width,
          height: res.height,
          gridRows: res.gridRows || 8,
          gridCols: res.gridCols || 12,
          description: res.description || '',
        });
      }
    } catch (error) {
      message.error($t('page.message.loadFail'));
    } finally {
      loading.value = false;
    }
  } else if (!isEdit.value && availableTypes.value.length > 0) {
    formData.locationType = availableTypes.value[0].value;
  }

  setTimeout(() => {
    formRef.value?.clearValidate();
  }, 0);
};

// 类型变化
const handleTypeChange = (value: string) => {
  const keys = typeOrder.value;
  const index = keys.indexOf(value);
  const isLastLevel = index === keys.length - 1;
  const isFirstLevel = index === 0;

  // 重置类型相关字段
  if (!isLastLevel) {
    formData.gridRows = undefined;
    formData.gridCols = undefined;
  } else {
    formData.gridRows = 8;
    formData.gridCols = 12;
  }

  if (isFirstLevel) {
    formData.capacity = undefined;
  }

  if (isLastLevel) {
    formData.length = undefined;
    formData.width = undefined;
    formData.height = undefined;
  }
};

// 提交
const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    loading.value = true;

    const data = { ...formData };
    
    // 处理根节点情况：如果 parentId 是 'root'，则改为 null
    if (data.parentId === 'root') {
      data.parentId = null;
    }

    if (isEdit.value && data.id) {
      await updateLocation(data.id, data);
      message.success($t('page.message.editSuccess'));
    } else {
      await createLocation(data);
      message.success($t('page.message.addSuccess'));
    }

    visible.value = false;
    emit('success');
  } catch (error: any) {
    if (error?.errorFields) return;
    message.error(isEdit.value ? $t('page.message.editFail') : $t('page.message.addFail'));
  } finally {
    loading.value = false;
  }
};

// 取消
const handleCancel = () => {
  formRef.value?.resetFields();
};

// 监听可用类型变化，设置默认类型
watch(availableTypes, (types) => {
  if (!isEdit.value && types.length > 0 && !types.find((t) => t.value === formData.locationType)) {
    formData.locationType = types[0].value;
  }
}, { immediate: true });


defineExpose({ open });
</script>

<style scoped lang="less">
.locationType-option {
  display: flex;
  align-items: center;
  gap: 8px;

  :deep(svg) {
    font-size: 18px;
  }
}
</style>
