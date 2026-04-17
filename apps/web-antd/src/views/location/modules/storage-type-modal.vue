<template>
  <Modal
    v-model:open="visible"
    title="新建存储对象"
    :confirm-loading="loading"
    width="680px"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <Form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      layout="vertical"
    >
      <FormItem label="所属仓库" name="warehouseCode">
        <Select
          v-model:value="formData.warehouseCode"
          placeholder="请选择仓库"
          show-search
          :filter-option="false"
          :options="warehouseOptions"
          :not-found-content="fetching ? '加载中...' : (warehouseOptions.length === 0 ? '无可用仓库' : '无匹配仓库')"
          :loading="fetching"
          @search="handleWarehouseSearch"
          @change="handleWarehouseChange"
        />
      </FormItem>

      <FormItem label="库位类型" name="locationType">
        <Select
          v-model:value="formData.locationType"
          placeholder="请选择库位类型"
          :options="locationTypeOptions"
          :loading="locationTypeLoading"
          :not-found-content="locationTypeLoading ? '加载中...' : '无选项'"
          style="width: 100%"
        />
      </FormItem>

      <FormItem label="库位编码" name="locationSortNo">
        <Input :value="formData.locationSortNo" disabled placeholder="自动生成" />
      </FormItem>

      <FormItem label="库位名称" name="locationName">
        <Input v-model:value="formData.locationName" placeholder="请输入库位名称" :maxlength="100" />
      </FormItem>

      <FormItem label="备注">
        <Input.TextArea v-model:value="formData.remarks" placeholder="可选" :rows="2" :maxlength="500" />
      </FormItem>
    </Form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue';
import {
  Form,
  FormItem,
  Input,
  Select,
  Modal,
  message,
} from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue/es/form';

import { add as addLocation, suggestCode } from '#/api/wms/location';
import { generateSerialNumber } from '#/api/system/serial-number';
import { listWarehouseSimpleForLocation } from '#/api/sys/warehouse';
import { listDictDataPage } from '#/api/sys/dict';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void;
  (e: 'success'): void;
}>();

// 仓库列表（options 格式）
const warehouseOptions = ref<Array<{ label: string; value: string }>>([]);
const fetching = ref(false);
let searchTimer: ReturnType<typeof setTimeout> | null = null;

// 库位类型（从字典 location_type_for_object 加载）
const locationTypeOptions = ref<Array<{ label: string; value: string }>>([]);
const locationTypeLoading = ref(false);

// 加载仓库列表
async function loadWarehouseList(keyword?: string) {
  try {
    fetching.value = true;
    const list = await listWarehouseSimpleForLocation();
    let filteredList = list;
    if (keyword) {
      const kw = keyword.toLowerCase();
      filteredList = list.filter(
        (item) =>
          item.label.toLowerCase().includes(kw) ||
          item.value.toLowerCase().includes(kw)
      );
    }
    warehouseOptions.value = filteredList;
  } catch (e) {
    console.error('加载仓库列表失败', e);
    warehouseOptions.value = [];
  } finally {
    fetching.value = false;
  }
}

// 加载库位类型字典
async function loadLocationTypeOptions() {
  locationTypeLoading.value = true;
  try {
    const res = await listDictDataPage({
      dictType: 'location_type_for_object',
      isEnabled: 1,
      pageNum: 1,
      pageSize: 999,
    });
    locationTypeOptions.value = (res.rows || []).map((r) => ({
      label: r.dictLabel,
      value: r.dictValue,
    }));
  } catch (e) {
    console.error('加载库位类型字典失败', e);
    locationTypeOptions.value = [];
  } finally {
    locationTypeLoading.value = false;
  }
}

// 搜索处理（防抖）
function handleWarehouseSearch(value: string) {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    loadWarehouseList(value);
  }, 300);
}

const loading = ref(false);
const formRef = ref<FormInstance>();

const formData = reactive({
  warehouseCode: '' as string,
  locationType: '',
  locationSortNo: '',
  locationName: '',
  remarks: '',
  internalSerialNo: 1,
  internalQuantity: 1,
});

const formRules = {
  warehouseCode: [{ required: true, message: '请选择仓库', trigger: 'change' }],
  locationType: [{ required: true, message: '请选择库位类型', trigger: 'change' }],
  locationName: [{ required: true, message: '请输入库位名称', trigger: 'blur' }],
};

// 仓库变化时，可以自动获取编码建议
const handleWarehouseChange = async (warehouseCode: string) => {
  console.log('[StorageTypeModal] warehouse changed:', warehouseCode);
  if (!warehouseCode) return;
  // 清除该字段的验证状态
  formRef.value?.clearValidate(['warehouseCode']);
  try {
    const res = await suggestCode({ warehouseCode, parentId: undefined, locationType: formData.locationType });
    if (res?.data?.suggestedCode) {
      // 可在名称中自动补全编码
      console.log('[StorageTypeModal] suggest code:', res.data.suggestedCode);
    }
  } catch (e) {
    console.error(e);
  }
};

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
});

async function handleSubmit() {
  try {
    console.log('[StorageTypeModal] submit formData:', JSON.stringify(formData));
    const validateResult = await formRef.value?.validate().catch((e) => {
      console.error('[StorageTypeModal] validate error:', e);
      return e;
    });
    console.log('[StorageTypeModal] validate result:', validateResult);
    if (validateResult?.errorFields?.length > 0) {
      return;
    }
    loading.value = true;

    const payload = {
      warehouseCode: formData.warehouseCode,
      locationType: formData.locationType,
      locationGrade: '存储对象',
      locationSortNo: formData.locationSortNo,
      locationName: formData.locationName,
      remarks: formData.remarks || '',
      parentId: null, // 根节点
      internalSerialNo: formData.internalSerialNo ?? 1,
      internalQuantity: formData.internalQuantity ?? 1,
    };

    await addLocation(payload);
    message.success('新建存储对象成功');
    visible.value = false;
    emit('success');
  } catch (e: any) {
    console.error('[StorageTypeModal] submit error:', e);
    message.error(e?.message || '新建失败');
  } finally {
    loading.value = false;
  }
}

function handleCancel() {
  visible.value = false;
}

// 生成库位编码
async function loadLocationSortNo() {
  try {
    const res = await generateSerialNumber('location_sort_no_object');
    const sortNo = res?.data ?? res;
    if (sortNo) {
      formData.locationSortNo = sortNo;
    }
  } catch (e) {
    console.error('[StorageTypeModal] 生成库位编码失败', e);
  }
}

// 重置表单
watch(visible, (val) => {
  if (val) {
    nextTick(() => {
      formRef.value?.resetFields();
      Object.assign(formData, {
        warehouseCode: '',
        locationType: '',
        locationSortNo: '',
        locationName: '',
        remarks: '',
        internalSerialNo: 1,
        internalQuantity: 1,
      });
      loadWarehouseList();
      loadLocationTypeOptions();
      loadLocationSortNo();
    });
  }
});
</script>