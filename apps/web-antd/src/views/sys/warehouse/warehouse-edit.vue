<template>
  <Page auto-content-height>
    <div class="wms-warehouse-edit-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <Button @click="handleBack">
            <template #icon><ArrowLeft /></template>
            返回
          </Button>
          <h1 class="page-title">{{ isEdit ? '编辑仓库档案' : '新建仓库档案' }}</h1>
        </div>
        <div class="header-right">
          <Button @click="handleBack">取消</Button>
          <Button type="primary" :loading="submitting" @click="handleSubmit">保存</Button>
        </div>
      </div>

      <!-- Warehouse Info Section -->
      <Card :bordered="false" class="info-card">
        <template #title>
          <span class="section-title">仓库基本信息</span>
        </template>
        <Form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          :label-col="{ span: 6 }"
          :wrapper-col="{ span: 18 }"
        >
          <Row :gutter="16">
            <Col :span="8">
              <FormItem label="仓库编码" name="warehouseCode">
                <Input
                  v-model:value="formData.warehouseCode"
                  :disabled="isEdit"
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
                  :rows="3"
                  maxlength="500"
                  show-count
                  placeholder="请输入备注"
                />
              </FormItem>
            </Col>
          </Row>
        </Form>
      </Card>

      <!-- Receiver Info Section -->
      <Card :bordered="false" class="info-card">
        <template #title>
          <div class="section-title-row">
            <span class="section-title">收货人信息</span>
            <Button type="primary" size="small" @click="handleAddReceiver">
              <template #icon><Plus /></template>
              添加
            </Button>
          </div>
        </template>
        <Table
          row-key="id"
          :loading="receiverLoading"
          :columns="receiverColumns"
          :data-source="receiverList"
          :pagination="false"
          :scroll="{ x: 800 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'isDefault'">
              <Tag :color="record.isDefault === 1 ? 'success' : 'default'">
                {{ record.isDefault === 1 ? '默认' : '-' }}
              </Tag>
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
                <Button
                  v-if="record.isDefault !== 1"
                  type="link"
                  size="small"
                  @click="handleSetDefault(record)"
                >
                  设为默认
                </Button>
              </Space>
            </template>
          </template>
        </Table>
      </Card>

      <!-- Receiver Drawer -->
      <WarehouseReceiverDrawer
        v-model:open="receiverDrawerVisible"
        :receiver-id="editingReceiverId"
        :warehouse-code="formData.warehouseCode"
        @success="loadReceiverList"
      />
    </div>
  </Page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Page } from '@vben/common-ui';
import { ArrowLeft, Plus } from 'lucide-vue-next';
import {
  Button,
  Card,
  Col,
  Form,
  FormItem,
  Input,
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
import type { Ref } from 'vue';

import WarehouseReceiverDrawer from './modules/warehouse-receiver-drawer.vue';
import {
  createWarehouse,
  getWarehouseDetail,
  updateWarehouse,
  type WarehouseResult,
} from '#/api/sys/warehouse';
import {
  deleteWarehouseReceiver,
  getWarehouseReceiverList,
  setDefaultWarehouseReceiver,
  type WarehouseReceiverResult,
} from '#/api/sys/warehouse-receiver';

interface WarehouseForm extends Partial<WarehouseResult> {
  id?: number;
}

const router = useRouter();
const route = useRoute();

const formRef = ref<FormInstance>();
const submitting = ref(false);
const receiverDrawerVisible = ref(false);
const editingReceiverId = ref<number | undefined>(undefined);
const receiverLoading = ref(false);

const isEdit = computed(() => !!route.query.id);

const formData = reactive<WarehouseForm>(createDefaultForm());

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
  { title: '序号', key: 'index', width: 70, customRender: ({ index }) => `${index + 1}` },
  { title: '收货人', dataIndex: 'consignee', key: 'consignee', width: 120 },
  { title: '联系电话', dataIndex: 'phoneNumber', key: 'phoneNumber', width: 130 },
  { title: '所在地区', key: 'region', width: 200, customRender: ({ record }) => `${record.province || ''} ${record.city || ''} ${record.district || ''}`.trim() },
  { title: '详细地址', dataIndex: 'detailedAddress', key: 'detailedAddress', width: 220 },
  { title: '邮编', dataIndex: 'postalCode', key: 'postalCode', width: 100 },
  { title: '默认地址', key: 'isDefault', width: 100 },
  { title: '操作', key: 'action', fixed: 'right', width: 180 },
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

function resetFormData() {
  Object.assign(formData, createDefaultForm());
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
      await loadReceiverList();
    } else {
      const res = await createWarehouse(formData);
      message.success('创建成功');
      // Try to get the created warehouse ID and navigate to edit page
      const createdId = (res as any)?.id || (res as any)?.data?.id;
      if (createdId) {
        router.replace({ path: '/sys/warehouse/edit', query: { id: String(createdId) } });
        Object.assign(formData, { id: createdId });
        await loadReceiverList();
      } else {
        router.push('/sys/warehouse');
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
  receiverDrawerVisible.value = true;
}

function handleEditReceiver(record: WarehouseReceiverResult) {
  editingReceiverId.value = record.id;
  receiverDrawerVisible.value = true;
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
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0 16px 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-card :deep(.ant-card-head) {
  min-height: 48px;
  padding: 0 16px;
}

.info-card :deep(.ant-card-body) {
  padding: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #1f2937;
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
</style>
