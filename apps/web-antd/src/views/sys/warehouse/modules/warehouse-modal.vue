<template>
  <Modal
    v-model:open="visible"
    :title="modalTitle"
    :confirm-loading="loading"
    width="900px"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <Form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 16 }"
    >
      <Divider orientation="left">基本信息</Divider>

      <Row :gutter="16">
        <Col :span="8">
          <FormItem :label="$t('page.warehouse.warehouseType')" name="warehouseType" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
            <Select
              v-model:value="formData.warehouseType"
              :placeholder="$t('page.common.selectPlaceholder')"
              :options="warehouseTypeOptions"
              :loading="dictLoading"
              style="width: 80%; margin-left: 10px"
              allow-clear
            />
          </FormItem>
        </Col>

        <Col :span="8">
          <FormItem label="存储物料分类" name="storedMaterial" :label-col="{ style: 'min-width: 100px' }">
            <Select
              v-model:value="formData.storedMaterial"
              :placeholder="$t('page.common.selectPlaceholder')"
              :options="storedMaterialOptions"
              :loading="dictLoading"
              style="width: 150px; margin-left: 10px"
              allow-clear
            />
          </FormItem>
        </Col>

        <Col :span="8">
          <FormItem :label="$t('page.warehouse.isEnabled')" name="isEnabled">
            <Switch
              v-model:checked="formData.isEnabled"
              :checked-value="1"
              :un-checked-value="0"
              style="width: 50px; margin-left: 10px"
            />
          </FormItem>
        </Col>
      </Row>
      <Row :gutter="16">
        <Col :span="8">
          <FormItem label="仓库编码" name="warehouseCode" :label-col="{ span: 8 }" extra="仅供参考，保存时自动生成">
            <Input
              v-model:value="formData.warehouseCode"
              placeholder="保存时自动生成"
              :disabled="!isEdit"
              style="width: 150px; margin-left: 10px"
            />
          </FormItem>
        </Col>
        <Col :span="4">
          <FormItem :label="$t('page.warehouse.warehouseLocation')" name="warehouseLocation":label-col="{ span: 10 }">
            <Select
              v-model:value="formData.warehouseLocation"
              :placeholder="$t('page.common.selectPlaceholder')"
              :options="warehouseLocationOptions"
              :loading="dictLoading"
              style="width: 100px; margin-left: 10px"
              allow-clear
            />
          </FormItem>
        </Col>      
        <Col :span="12">
          <FormItem :label="$t('page.warehouse.warehouseName')" name="warehouseName" :label-col="{ span: 8 }">
            <Input
              v-model:value="formData.warehouseName"
              :placeholder="$t('page.common.inputPlaceholder')"
              :maxlength="100"
              style="width: 95%; margin-left: 10px"
            />
          </FormItem>
        </Col>
      </Row>

      <Row :gutter="16">
        <Col :span="10">
          <FormItem :label="$t('page.warehouse.qualityZone')" name="qualityZone" >
            <Select
              v-model:value="formData.qualityZone"
              :placeholder="$t('page.common.selectPlaceholder')"
              :options="qualityZoneOptions"
              :loading="dictLoading"
              mode="multiple"
              allow-clear
            />
          </FormItem>
        </Col>
        <Col :span="14">
          <FormItem :label="$t('page.warehouse.temperatureZone')" name="temperatureZone" :label-col="{ span: 4 }" :wrapper-col="{ span: 22 }">
            <Select
              v-model:value="formData.temperatureZone"
              :placeholder="$t('page.common.selectPlaceholder')"
              :options="temperatureZoneOptions"
              :loading="dictLoading"
              mode="multiple"
              style="width: 100%"
              allow-clear
            />
          </FormItem>
        </Col>
      </Row>

      <Row :gutter="16">
        <Col :span="8">
          <FormItem :label="$t('page.warehouse.employeeName')">
            <Input
              v-model:value="formData.employeeName"
              :placeholder="$t('page.common.inputPlaceholder')"
              :maxlength="50"
            />
          </FormItem>
        </Col>
        <Col :span="16">
          <FormItem :label="$t('page.warehouse.deptNameFullPath')" name="deptNameFullPath">
            <Input
              v-model:value="formData.deptNameFullPath"
              :placeholder="$t('page.common.inputPlaceholder')"
              :maxlength="200"
              style="width: 112%"
            />
          </FormItem>
        </Col>     
      </Row>

      <Row :gutter="16">

        <Col :span="24">
          <FormItem :label="$t('page.warehouse.remark')" :label-col="{ span: 2 }" :wrapper-col="{ span: 24 }">
            <Input
              v-model:value="formData.remarks"
              :placeholder="$t('page.common.inputPlaceholder')"
              :maxlength="500"
              show-count
            />
          </FormItem>
        </Col>
      </Row>



      <Divider orientation="left">关联ERP</Divider>

      <Row :gutter="16">
        <Col :span="12">
          <FormItem :label="$t('page.warehouse.erpCompanyCode')">
            <Input
              v-model:value="formData.erpCompanyCode"
              :placeholder="$t('page.common.inputPlaceholder')"
              :maxlength="50"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem :label="$t('page.warehouse.erpCompanyName')" name="erpCompanyName">
            <Select
              v-model:value="formData.erpCompanyName"
              :placeholder="$t('page.common.selectPlaceholder')"
              :options="erpCompanyNameOptions"
              :loading="dictLoading"
              allow-clear
            />
          </FormItem>
        </Col>
      </Row>

      <Row :gutter="16">
        <Col :span="12">
          <FormItem :label="$t('page.warehouse.erpWarehouseCode')">
            <Input
              v-model:value="formData.erpWarehouseCode"
              :placeholder="$t('page.common.inputPlaceholder')"
              :maxlength="50"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem :label="$t('page.warehouse.erpLocationCode')">
            <Input
              v-model:value="formData.erpLocationCode"
              :placeholder="$t('page.common.inputPlaceholder')"
              :maxlength="50"
            />
          </FormItem>
        </Col>
      </Row>
    </Form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { $t } from '@vben/locales';
import {
  Col,
  Divider,
  Form,
  FormItem,
  Input,
  Modal,
  Row,
  Select,
  Switch,
  Textarea,
  message,
} from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue/es/form';

import {
  createWarehouse,
  updateWarehouse,
  getWarehouseDetail,
  createWarehouseBatch,
} from '#/api/sys/warehouse';
import { listDictDataPage } from '#/api/sys/dict';
import { getSerialNumberList } from '#/api/system/serial-number';
import type { DictDataResult } from '#/api/sys/dict';

const props = defineProps<{
  warehouseId?: number;
}>();

const emit = defineEmits<{
  success: [];
  cancel: [];
}>();

const visible = defineModel<boolean>('open', { required: true });

const formRef = ref<FormInstance>();
const loading = ref(false);
const isEdit = computed(() => !!props.warehouseId);

const modalTitle = computed(() =>
  isEdit.value ? $t('page.warehouse.editTitle') : $t('page.warehouse.addTitle')
);

// 字典数据下拉选项
const dictLoading = ref(false);
const warehouseTypeOptions = ref<{ label: string; value: string }[]>([]);
const warehouseLocationOptions = ref<{ label: string; value: string }[]>([]);
const temperatureZoneOptions = ref<{ label: string; value: string }[]>([]);
const qualityZoneOptions = ref<{ label: string; value: string }[]>([]);
const storedMaterialOptions = ref<{ label: string; value: string }[]>([]);
const erpCompanyNameOptions = ref<{ label: string; value: string }[]>([]);

// 字段与字典类型的映射关系
const fieldDictTypeMap: Record<string, string> = {
  warehouseType: 'inv_warehouse|warehouse_type',
  warehouseLocation: 'inv_warehouse_type|warehouse_location',
  temperatureZone: 'inv_warehouse|temperature_zone',
  qualityZone: 'inv_warehouse|quality_zone',
  storedMaterial: 'inv_warehouse|stored_material',
  erpCompanyName: 'inv_warehouse|erp_company_name',
};

// 加载字典数据
async function loadDictData() {
  dictLoading.value = true;
  try {
    // 并行加载所有字典数据
    const dictTypes = Object.values(fieldDictTypeMap);
    const results = await Promise.all(
      dictTypes.map((dictType) =>
        listDictDataPage({ dictType, isEnabled: 1, pageSize: 999 }).catch(() => ({ rows: [] }))
      )
    );

    // 分类赋值
    const optionsMap: Record<string, { label: string; value: string }[]> = {};
    Object.entries(fieldDictTypeMap).forEach(([field, dictType]) => {
      const idx = dictTypes.indexOf(dictType);
      const data = results[idx];
      const rows: DictDataResult[] = data?.rows || [];
      optionsMap[field] = rows.map((r) => ({
        label: r.dictLabel || String(r.dictValue || ''),
        value: r.dictValue || r.dictLabel || '',
      }));
    });

    warehouseTypeOptions.value = optionsMap.warehouseType || [];
    warehouseLocationOptions.value = optionsMap.warehouseLocation || [];
    temperatureZoneOptions.value = optionsMap.temperatureZone || [];
    qualityZoneOptions.value = optionsMap.qualityZone || [];
    storedMaterialOptions.value = optionsMap.storedMaterial || [];
    erpCompanyNameOptions.value = optionsMap.erpCompanyName || [];
  } catch (err) {
    console.error('[WarehouseModal] loadDictData error:', err);
  } finally {
    dictLoading.value = false;
  }
}

const formData = reactive<Record<string, any>>({
  id: undefined,
  warehouseType: '',
  warehouseCode: '',
  warehouseLocation: '',
  warehouseName: '',
  temperatureZone: [] as string[],
  qualityZone: [] as string[],
  storedMaterial: '',
  employeeCode: '',
  employeeName: '',
  deptCode: '',
  deptNameFullPath: '',
  erpCompanyCode: '',
  erpCompanyName: '',
  erpWarehouseCode: '',
  erpLocationCode: '',
  isEnabled: 1,
  remarks: '',
});

const formRules = {
  warehouseType: [
    { required: true, message: '请选择仓库类型', trigger: 'change' },
  ],
  warehouseCode: [
    { required: false, message: '仓库编码不能为空', trigger: 'blur' },
  ],
  warehouseName: [
    { required: true, message: () => $t('page.warehouse.nameRequired'), trigger: 'blur' },
    { max: 100, message: () => $t('page.warehouse.nameMaxLength'), trigger: 'blur' },
  ],
  temperatureZone: [
    { required: true, message: '请选择温度分区', trigger: 'change' },
  ],
  qualityZone: [
    { required: true, message: '请选择质量分区', trigger: 'change' },
  ],
  storedMaterial: [
    { required: true, message: '请选择存储物料分类', trigger: 'change' },
  ],
  deptNameFullPath: [
    { required: true, message: '请输入责任部门全路径', trigger: 'blur' },
  ],
  isEnabled: [
    { required: true, message: () => $t('page.warehouse.statusRequired'), trigger: 'change' },
  ],
};

// 加载详情
const loadDetail = async (id: number) => {
  try {
    const res = await getWarehouseDetail(id);
    const data = res || {};
    if (data.temperatureZone && typeof data.temperatureZone === 'string') {
      data.temperatureZone = data.temperatureZone.split(',').filter(Boolean);
    }
    if (data.qualityZone && typeof data.qualityZone === 'string') {
      data.qualityZone = data.qualityZone.split(',').filter(Boolean);
    }
    Object.assign(formData, data);
  } catch {
    message.error($t('page.warehouse.loadDetailFailed'));
  }
};

// 加载流水号规则并拼接预览编码（不消耗流水号）
async function loadWarehouseCode() {
  try {
    const res = await getSerialNumberList({ applyFormField: 'inv_warehouse|warehouse_code', pageSize: 999 });
    const rows = res.rows || [];
    if (rows.length === 0) {
      console.warn('[WarehouseModal] 未找到流水号规则: inv_warehouse|warehouse_code');
      return;
    }
    const rule = rows[0];
    const prefix = rule.prefix || '';
    const suffix = rule.suffix || '';
    const seqLength = rule.seqLength || rule.seq_length || 4;
    const currentSeq = rule.currentSeq || rule.current_seq || 1;
    const dateFormat = rule.dateFormat || rule.date_format || '';

    // 拼接序号部分
    const seqStr = String(currentSeq).padStart(seqLength, '0');

    // 日期部分（如有）
    let datePart = '';
    if (dateFormat) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      if (dateFormat === 'yyyy') datePart = String(year);
      else if (dateFormat === 'yyyyMM') datePart = `${year}${month}`;
      else if (dateFormat === 'yyyyMMdd') datePart = `${year}${month}${day}`;
    }

    formData.warehouseCode = `${prefix}${datePart}${seqStr}${suffix}`;
  } catch (e: any) {
    console.warn('[WarehouseModal] 加载仓库编码失败:', e?.message || e);
  }
}

// 打开弹窗时加载数据
const open = async (id?: number) => {
  visible.value = true;
  resetForm();
  await loadDictData();
  if (id) {
    await loadDetail(id);
  } else {
    await loadWarehouseCode();
  }
};

// 提交
const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    loading.value = true;

    if (isEdit.value) {
      await updateWarehouse({
        ...formData,
        temperatureZone: formData.temperatureZone?.join(','),
        qualityZone: formData.qualityZone?.join(','),
      });
      message.success($t('page.common.updateSuccess'));
    } else {
      const hasMultiTemp = (formData.temperatureZone || []).length > 1;
      const hasMultiQuality = (formData.qualityZone || []).length > 1;

      if (hasMultiTemp || hasMultiQuality) {
        // 批量创建：根据温度分区和质量分区的笛卡尔积生成多个仓库
        await createWarehouseBatch({
          warehouseType: formData.warehouseType,
          warehouseLocation: formData.warehouseLocation,
          warehouseName: formData.warehouseName,
          temperatureZones: formData.temperatureZone || [],
          qualityZones: formData.qualityZone || [],
          employeeCode: formData.employeeCode,
          employeeName: formData.employeeName,
          deptCode: formData.deptCode,
          deptNameFullPath: formData.deptNameFullPath,
          erpCompanyCode: formData.erpCompanyCode,
          erpCompanyName: formData.erpCompanyName,
          erpWarehouseCode: formData.erpWarehouseCode,
          erpLocationCode: formData.erpLocationCode,
          isEnabled: formData.isEnabled,
          remarks: formData.remarks,
          storedMaterial: formData.storedMaterial,
        });
        message.success($t('page.common.createSuccess'));
      } else {
        // 单个创建：兼容只有一个温度分区和一个质量分区的情况
        await createWarehouse({
          ...formData,
          temperatureZone: formData.temperatureZone?.join(','),
          qualityZone: formData.qualityZone?.join(','),
        });
        message.success($t('page.common.createSuccess'));
      }
    }

    visible.value = false;
    emit('success');
  } catch (error) {
    // 表单验证失败或请求失败
  } finally {
    loading.value = false;
  }
};

// 取消
const handleCancel = () => {
  visible.value = false;
  resetForm();
  emit('cancel');
};

// 重置表单
const resetForm = () => {
  formData.id = undefined;
  formData.warehouseType = '';
  formData.warehouseCode = '';
  formData.warehouseLocation = '';
  formData.warehouseName = '';
  formData.temperatureZone = [];
  formData.qualityZone = [];
  formData.storedMaterial = '';
  formData.employeeCode = '';
  formData.employeeName = '';
  formData.deptCode = '';
  formData.deptNameFullPath = '';
  formData.erpCompanyCode = '';
  formData.erpCompanyName = '';
  formData.erpWarehouseCode = '';
  formData.erpLocationCode = '';
  formData.isEnabled = 1;
  formData.remarks = '';
  formRef.value?.resetFields();
};

// 暴露方法
defineExpose({
  open,
});
</script>
