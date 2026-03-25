<template>
  <Page auto-content-height>
    <div class="wms-warehouse-edit-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <Button @click="handleBack" class="back-btn">
            <template #icon><ArrowLeft /></template>
          </Button>
          <div class="header-titles">
            <h1 class="page-title">{{ isEdit ? '编辑仓库档案' : '新建仓库档案' }}</h1>
            <p class="page-subtitle">
              {{ isEdit ? `编辑仓库编号: ${formData.warehouseCode}` : '填写仓库基本信息和收货人信息' }}
            </p>
          </div>
        </div>
        <div class="header-right">
          <Button @click="handleBack">取消</Button>
          <Button type="primary" :loading="submitting" @click="handleSubmit">
            <template #icon><Save /></template>
            保存
          </Button>
        </div>
      </div>

      <!-- 仓库基本信息 -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="section-header">
          <Building2 class="section-icon" />
          <span class="section-title">仓库基本信息</span>
        </div>

        <!-- 编辑提示横幅 -->
        <Alert
          v-if="isEdit"
          type="warning"
          show-icon
          class="edit-warning-alert"
          message="编辑提示：仓库编码、仓库名称、温度分区、质量分区、所属公司、备注 为系统保护字段，创建后不可修改。可修改字段：责任人工号、责任人、责任部门编号、责任部门全路径、是否启用。"
        />

        <Form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          :label-col="{ span: 6 }"
          :wrapper-col="{ span: 18 }"
          class="warehouse-form"
        >
          <Row :gutter="16">
            <Col :span="8">
              <FormItem label="仓库编码" name="warehouseCode">
                <Input
                  v-model:value="formData.warehouseCode"
                  :disabled="isEdit"
                  :class="{ 'ant-input-disabled': isEdit }"
                  maxlength="50"
                  placeholder="请输入仓库编码"
                />
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label="仓库名称" name="warehouseName">
                <Input
                  v-model:value="formData.warehouseName"
                  :disabled="isEdit"
                  :class="{ 'ant-input-disabled': isEdit }"
                  maxlength="100"
                  placeholder="请输入仓库名称"
                />
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label="温度分区" name="temperatureZone">
                <Select
                  v-model:value="formData.temperatureZone"
                  :disabled="isEdit"
                  :class="{ 'ant-input-disabled': isEdit }"
                  :options="temperatureZoneOptions"
                  placeholder="请选择温度分区"
                />
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label="质量分区" name="qualityZone">
                <Select
                  v-model:value="formData.qualityZone"
                  :disabled="isEdit"
                  :class="{ 'ant-input-disabled': isEdit }"
                  :options="qualityZoneOptions"
                  placeholder="请选择质量分区"
                />
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label="责任人工号" name="employeeCode">
                <Input v-model:value="formData.employeeCode" maxlength="50" placeholder="请输入责任人工号" />
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label="责任人" name="employeeName">
                <Input v-model:value="formData.employeeName" maxlength="100" placeholder="请输入责任人" />
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label="责任部门编号" name="deptCode">
                <Input v-model:value="formData.deptCode" maxlength="50" placeholder="请输入责任部门编号" />
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label="责任部门全路径" name="deptNameFullPath">
                <Input v-model:value="formData.deptNameFullPath" maxlength="200" placeholder="请输入责任部门全路径" />
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label="所属公司" name="company">
                <Select
                  v-model:value="formData.company"
                  :disabled="isEdit"
                  :class="{ 'ant-input-disabled': isEdit }"
                  :options="companyOptions"
                  placeholder="请选择所属公司"
                />
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label="是否启用" name="isEnabled">
                <RadioGroup v-model:value="formData.isEnabled">
                  <Radio :value="1">启用</Radio>
                  <Radio :value="0">停用</Radio>
                </RadioGroup>
              </FormItem>
            </Col>
            <Col :span="24">
              <FormItem label="备注" name="remark" :label-col="{ span: 2 }" :wrapper-col="{ span: 22 }">
                <Input.TextArea
                  v-model:value="formData.remark"
                  :disabled="isEdit"
                  :class="{ 'ant-input-disabled': isEdit }"
                  :rows="3"
                  maxlength="500"
                  show-count
                  placeholder="请输入备注"
                />
              </FormItem>
            </Col>
          </Row>
        </Form>

        <!-- 系统信息 -->
        <div v-if="isEdit" class="system-info">
          <div class="system-info-row">
            <span class="system-info-label">添加人：</span>
            <span class="system-info-value">{{ formData.createBy || '-' }}</span>
            <span class="system-info-label ml-6">添加时间：</span>
            <span class="system-info-value">{{ formData.createTime || '-' }}</span>
            <span class="system-info-label ml-6">上次修改人：</span>
            <span class="system-info-value">{{ formData.updateBy || '-' }}</span>
            <span class="system-info-label ml-6">上次修改时间：</span>
            <span class="system-info-value">{{ formData.updateTime || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- 收货人信息 -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="section-header">
          <User class="section-icon" />
          <span class="section-title">收货人信息</span>
        </div>

        <div v-if="receiverList.length === 0" class="receiver-empty">
          <User class="receiver-empty-icon" />
          <p>暂无收货人信息</p>
          <p class="receiver-empty-hint">点击"添加收货人"按钮开始添加</p>
        </div>

        <Table
          v-else
          row-key="id"
          :loading="receiverLoading"
          :columns="receiverColumns"
          :data-source="receiverList"
          :pagination="false"
          :scroll="{ x: 900 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'phoneNumber'">
              {{ maskPhone(record.phoneNumber) }}
            </template>
            <template v-else-if="column.key === 'address'">
              {{ record.country || '' }}{{ record.province || '' }}{{ record.city || '' }}{{ record.district || '' }}{{ record.detailedAddress || '' }}
            </template>
            <template v-else-if="column.key === 'isDefault'">
              <Tag v-if="record.isDefault === 1" color="success">
                <template #icon><Check /></template>
                默认
              </Tag>
              <Button v-else type="link" size="small" @click="handleSetDefault(record)">设为默认</Button>
            </template>
            <template v-else-if="column.key === 'action'">
              <Space>
                <Button type="link" size="small" @click="handleEditReceiver(record)">编辑</Button>
                <Popconfirm
                  title="确认删除该收货人记录吗？"
                  ok-text="确定"
                  cancel-text="取消"
                  @confirm="handleDeleteReceiver(record)"
                >
                  <Button type="link" danger size="small">删除</Button>
                </Popconfirm>
              </Space>
            </template>
          </template>
        </Table>

        <div class="receiver-add-btn-wrap">
          <Button type="primary" @click="handleAddReceiver">
            <template #icon><Plus /></template>
            添加收货人
          </Button>
        </div>
      </div>

      <!-- 收货人编辑弹框 -->
      <Modal
        v-model:open="receiverFormVisible"
        :title="editingReceiverId ? '编辑收货人' : '添加收货人'"
        width="640px"
        :footer="null"
        :mask-closable="false"
        :destroy-on-close="true"
      >
        <Form
          ref="receiverFormRef"
          :model="receiverFormData"
          :rules="receiverFormRules"
          layout="vertical"
          class="receiver-form"
        >
          <Row :gutter="16">
            <Col :span="12">
              <FormItem label="收货人" name="consignee">
                <Input v-model:value="receiverFormData.consignee" placeholder="请输入收货人姓名" allow-clear />
              </FormItem>
            </Col>
            <Col :span="12">
              <FormItem label="手机号码" name="phoneNumber">
                <Input v-model:value="receiverFormData.phoneNumber" placeholder="请输入手机号码" allow-clear maxlength="11" />
              </FormItem>
            </Col>
          </Row>
          <Row :gutter="16">
            <Col :span="12">
              <FormItem label="国家" name="country">
                <Input v-model:value="receiverFormData.country" placeholder="请输入国家" allow-clear />
              </FormItem>
            </Col>
            <Col :span="12">
              <FormItem label="省市" name="province">
                <Input v-model:value="receiverFormData.province" placeholder="请输入省市" allow-clear />
              </FormItem>
            </Col>
          </Row>
          <Row :gutter="16">
            <Col :span="12">
              <FormItem label="区/县" name="district">
                <Input v-model:value="receiverFormData.district" placeholder="请输入区/县" allow-clear />
              </FormItem>
            </Col>
            <Col :span="12">
              <FormItem label="邮编" name="postalCode">
                <Input v-model:value="receiverFormData.postalCode" placeholder="请输入邮编" allow-clear maxlength="10" />
              </FormItem>
            </Col>
          </Row>
          <FormItem label="详细地址" name="detailedAddress">
            <Input.TextArea
              v-model:value="receiverFormData.detailedAddress"
              placeholder="请输入详细地址"
              :rows="2"
              allow-clear
              show-count
              :maxlength="500"
            />
          </FormItem>
          <FormItem label="备注" name="note">
            <Input.TextArea
              v-model:value="receiverFormData.note"
              placeholder="请输入备注"
              :rows="2"
              allow-clear
              :maxlength="200"
            />
          </FormItem>
          <FormItem>
            <Checkbox v-model:checked="receiverFormIsDefault">设为默认收货人</Checkbox>
          </FormItem>
        </Form>
        <div class="receiver-form-footer">
          <Button @click="receiverFormVisible = false">取消</Button>
          <Button type="primary" :loading="receiverSubmitting" @click="handleSaveReceiver">保存</Button>
        </div>
      </Modal>
    </div>
  </Page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Page } from '@vben/common-ui';
import { ArrowLeft, Save, Plus, Building2, User, Check } from 'lucide-vue-next';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Form,
  FormItem,
  Input,
  Modal,
  Radio,
  RadioGroup,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Popconfirm,
  message,
} from 'ant-design-vue';
import type { FormInstance, TableColumnsType } from 'ant-design-vue';

import {
  createWarehouse,
  getWarehouseDetail,
  updateWarehouse,
  type WarehouseResult,
} from '#/api/sys/warehouse';
import {
  createWarehouseReceiver,
  deleteWarehouseReceiver,
  getWarehouseReceiverList,
  setDefaultWarehouseReceiver,
  updateWarehouseReceiver,
  type WarehouseReceiverResult,
} from '#/api/sys/warehouse-receiver';

interface WarehouseForm extends Partial<WarehouseResult> {
  id?: number;
}

const router = useRouter();
const route = useRoute();

const formRef = ref<FormInstance>();
const submitting = ref(false);
const receiverLoading = ref(false);
const receiverSubmitting = ref(false);
const receiverFormRef = ref<FormInstance>();
const receiverFormVisible = ref(false);
const editingReceiverId = ref<number | undefined>(undefined);

const isEdit = computed(() => !!route.query.id);

const formData = reactive<WarehouseForm>(createDefaultForm());

const receiverFormData = reactive({
  consignee: '',
  phoneNumber: '',
  country: '中国',
  province: '',
  city: '',
  district: '',
  detailedAddress: '',
  postalCode: '',
  note: '',
  isDefault: 0,
});
const receiverFormIsDefault = ref(false);
const receiverFormRules = {
  consignee: [{ required: true, message: '请输入收货人', trigger: 'blur' }],
  phoneNumber: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
};

const temperatureZoneOptions = [
  { label: '常温', value: 'NORMAL' },
  { label: '2-8℃', value: 'COLD' },
  { label: '-20℃', value: 'FREEZE' },
  { label: '-80℃', value: 'CONSTANT' },
  { label: '液氮', value: 'LIQUID_NITROGEN' },
];

const qualityZoneOptions = [
  { label: '合格区', value: 'QUALIFIED' },
  { label: '待检区', value: 'PENDING' },
  { label: '不合格区', value: 'UNQUALIFIED' },
  { label: '隔离区', value: 'ISOLATION' },
  { label: '退货区', value: 'RETURN' },
];

const companyOptions = [
  { label: '母公司', value: 'PARENT' },
  { label: '子公司A', value: 'CHILD_A' },
  { label: '子公司B', value: 'CHILD_B' },
];

const formRules = {
  warehouseCode: [{ required: true, message: '请输入仓库编码', trigger: 'blur' }],
  warehouseName: [{ required: true, message: '请输入仓库名称', trigger: 'blur' }],
  temperatureZone: [{ required: true, message: '请选择温度分区', trigger: 'change' }],
  qualityZone: [{ required: true, message: '请选择质量分区', trigger: 'change' }],
  company: [{ required: true, message: '请选择所属公司', trigger: 'change' }],
  isEnabled: [{ required: true, message: '请选择是否启用', trigger: 'change' }],
};

const receiverColumns: TableColumnsType<WarehouseReceiverResult> = [
  { title: '收货人', dataIndex: 'consignee', key: 'consignee', width: 100 },
  { title: '手机号码', dataIndex: 'phoneNumber', key: 'phoneNumber', width: 130 },
  { title: '地址', key: 'address', width: 280 },
  { title: '邮编', dataIndex: 'postalCode', key: 'postalCode', width: 100 },
  { title: '默认', key: 'isDefault', width: 90, align: 'center' as const },
  { title: '备注', dataIndex: 'note', key: 'note', width: 120, ellipsis: true },
  { title: '操作', key: 'action', fixed: 'right', width: 140 },
];

const receiverList = ref<WarehouseReceiverResult[]>([]);

function createDefaultForm(): WarehouseForm {
  return {
    warehouseCode: '',
    warehouseName: '',
    temperatureZone: undefined,
    qualityZone: undefined,
    company: undefined,
    employeeCode: '',
    employeeName: '',
    deptCode: '',
    deptNameFullPath: '',
    isEnabled: 1,
    remark: '',
  };
}

function maskPhone(phone: string) {
  if (!phone || phone.length !== 11) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(7)}`;
}

async function loadWarehouseDetail(id: number) {
  try {
    const detail = await getWarehouseDetail(id);
    Object.assign(formData, detail || {}, { id });
  } catch {
    message.error('仓库详情加载失败');
  }
}

async function loadReceiverList() {
  if (!formData.warehouseCode) return;
  receiverLoading.value = true;
  try {
    const res = await getWarehouseReceiverList({ warehouseCode: formData.warehouseCode });
    receiverList.value = res.rows || res.list || res.data?.rows || [];
  } catch {
    receiverList.value = [];
  } finally {
    receiverLoading.value = false;
  }
}

async function handleSubmit() {
  try {
    await formRef.value?.validate();
    submitting.value = true;
    if (isEdit.value) {
      await updateWarehouse(formData as WarehouseResult);
      message.success('保存成功');
    } else {
      const res = await createWarehouse(formData);
      message.success('创建成功');
      const createdId = (res as any)?.id || (res as any)?.data?.id;
      if (createdId) {
        router.replace({ path: '/sys/warehouse/edit', query: { id: String(createdId) } });
        Object.assign(formData, { id: createdId });
      }
    }
  } catch (error: any) {
    if (error?.errorFields) return;
    message.error(error?.message || '保存失败');
  } finally {
    submitting.value = false;
  }
}

function handleBack() {
  router.push('/sys/warehouse');
}

function handleAddReceiver() {
  if (!formData.warehouseCode) {
    message.warning('请先保存仓库基本信息后再添加收货人');
    return;
  }
  editingReceiverId.value = undefined;
  receiverFormData.consignee = '';
  receiverFormData.phoneNumber = '';
  receiverFormData.country = '中国';
  receiverFormData.province = '';
  receiverFormData.city = '';
  receiverFormData.district = '';
  receiverFormData.detailedAddress = '';
  receiverFormData.postalCode = '';
  receiverFormData.note = '';
  receiverFormIsDefault.value = false;
  receiverFormVisible.value = true;
}

function handleEditReceiver(record: WarehouseReceiverResult) {
  editingReceiverId.value = record.id;
  receiverFormData.consignee = record.consignee || '';
  receiverFormData.phoneNumber = record.phoneNumber || '';
  receiverFormData.country = record.country || '中国';
  receiverFormData.province = record.province || '';
  receiverFormData.city = record.city || '';
  receiverFormData.district = record.district || '';
  receiverFormData.detailedAddress = record.detailedAddress || '';
  receiverFormData.postalCode = record.postalCode || '';
  receiverFormData.note = record.note || '';
  receiverFormIsDefault.value = record.isDefault === 1;
  receiverFormVisible.value = true;
}

async function handleSaveReceiver() {
  try {
    await receiverFormRef.value?.validate();
    receiverSubmitting.value = true;
    const data = {
      ...receiverFormData,
      warehouseCode: formData.warehouseCode,
      isDefault: receiverFormIsDefault.value ? 1 : 0,
    };
    if (editingReceiverId.value) {
      await updateWarehouseReceiver(editingReceiverId.value, data);
      message.success('编辑成功');
    } else {
      await createWarehouseReceiver(data);
      message.success('添加成功');
    }
    receiverFormVisible.value = false;
    await loadReceiverList();
  } catch (error) {
    // validation failed
  } finally {
    receiverSubmitting.value = false;
  }
}

async function handleDeleteReceiver(record: WarehouseReceiverResult) {
  try {
    await deleteWarehouseReceiver(record.id);
    message.success('删除成功');
    await loadReceiverList();
  } catch (error: any) {
    message.error(error?.message || '删除失败');
  }
}

async function handleSetDefault(record: WarehouseReceiverResult) {
  try {
    await setDefaultWarehouseReceiver(record.id);
    message.success('设置默认地址成功');
    await loadReceiverList();
  } catch (error: any) {
    message.error(error?.message || '设置失败');
  }
}

onMounted(async () => {
  const id = route.query.id;
  if (id) {
    await loadWarehouseDetail(Number(id));
    await loadReceiverList();
  }
});
</script>

<style scoped>
.wms-warehouse-edit-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 80px;
}

/* Page Header */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0 0 16px 0;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.back-btn {
  margin-top: 2px;
}

.header-titles {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  line-height: 1.4;
}

.page-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Section Header */
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.section-icon {
  width: 20px;
  height: 20px;
  color: #6b7280;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #1f2937;
}

/* Edit Warning Alert */
.edit-warning-alert {
  margin-bottom: 16px;
}

/* Warehouse Form */
.warehouse-form {
  padding-top: 8px;
}

/* System Info */
.system-info {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.system-info-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.system-info-label {
  color: #9ca3af;
}

.system-info-value {
  color: #374151;
}

.ml-6 {
  margin-left: 24px;
}

/* Receiver Section */
.receiver-empty {
  text-align: center;
  padding: 32px 0;
  color: #9ca3af;
  font-size: 14px;
}

.receiver-empty-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 12px;
  color: #d1d5db;
}

.receiver-empty-hint {
  font-size: 12px;
  margin-top: 4px;
}

.receiver-add-btn-wrap {
  margin-top: 16px;
}

/* Receiver Form */
.receiver-form {
  padding-top: 8px;
}

.receiver-form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  margin-top: 8px;
}
</style>
