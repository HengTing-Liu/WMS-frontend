<template>
  <Page auto-content-height>
    <div class="wms-warehouse-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">WMS0010 仓库档案</h1>
          <p class="page-desc">管理仓库基本信息、温区、质检分区等</p>
        </div>
        <div class="header-right">
          <Button v-access:code="'base:warehouse:add'" type="primary" @click="handleAdd">
            <template #icon><Plus /></template>
            新建仓库
          </Button>
        </div>
      </div>

      <!-- Search & Filter Bar -->
      <Card class="filter-card" :bordered="false">
        <div class="filter-bar">
          <div class="search-input-wrap">
            <Search class="search-icon" />
            <Input
              v-model:value="queryForm.warehouseName"
              allow-clear
              placeholder="搜索仓库名称..."
              class="search-input"
              @press-enter="handleSearch"
            />
          </div>
          <Select
            v-model:value="queryForm.isEnabled"
            allow-clear
            placeholder="全部状态"
            class="status-select"
            :options="statusFilterOptions"
            @change="handleSearch"
          />
          <Popover v-model:open="filterPopoverVisible" trigger="click" placement="bottomLeft">
            <template #content>
              <div class="filter-popover-content">
                <div class="filter-popover-title">选择筛选字段</div>
                <CheckboxGroup v-model:value="selectedFilters" class="filter-checkbox-group">
                  <Row :gutter="[0, 8]">
                    <Col v-for="item in filterFieldOptions" :key="item.value" :span="12">
                      <Checkbox :value="item.value">{{ item.label }}</Checkbox>
                    </Col>
                  </Row>
                </CheckboxGroup>
                <div class="filter-popover-divider" />
                <div class="filter-dynamic-inputs">
                  <FormItem v-show="selectedFilters.includes('warehouseCode')" label="仓库编码" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
                    <Input v-model:value="queryForm.warehouseCode" allow-clear placeholder="请输入仓库编码" />
                  </FormItem>
                  <FormItem v-show="selectedFilters.includes('warehouseName')" label="仓库名称" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
                    <Input v-model:value="queryForm.warehouseName" allow-clear placeholder="请输入仓库名称" />
                  </FormItem>
                  <FormItem v-show="selectedFilters.includes('company')" label="所属公司" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
                    <Input v-model:value="queryForm.company" allow-clear placeholder="请输入所属公司" />
                  </FormItem>
                  <FormItem v-show="selectedFilters.includes('temperatureZone')" label="温区" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
                    <Select v-model:value="queryForm.temperatureZone" allow-clear :options="temperatureZoneOptions" placeholder="请选择温区" />
                  </FormItem>
                  <FormItem v-show="selectedFilters.includes('qualityZone')" label="质量区" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
                    <Select v-model:value="queryForm.qualityZone" allow-clear :options="qualityZoneOptions" placeholder="请选择质量区" />
                  </FormItem>
                  <FormItem v-show="selectedFilters.includes('isEnabled')" label="状态" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
                    <Select v-model:value="queryForm.isEnabled" allow-clear :options="statusValueOptions" placeholder="请选择状态" />
                  </FormItem>
                </div>
                <div class="filter-popover-actions">
                  <Button type="primary" size="small" @click="handleSearch">查询</Button>
                  <Button size="small" @click="handleReset">重置</Button>
                </div>
              </div>
            </template>
            <Button>
              <template #icon><Filter /></template>
              更多筛选
            </Button>
          </Popover>
          <Button v-access:code="'base:warehouse:export'" :loading="exporting" @click="handleExport">
            <template #icon><Download /></template>
            导出
          </Button>
        </div>
      </Card>

      <!-- Stats Cards -->
      <div class="stats-row">
        <Card class="stat-card stat-total" :bordered="false">
          <div class="stat-content">
            <div class="stat-icon-wrap stat-icon-blue">
              <Warehouse />
            </div>
            <div class="stat-info">
              <p class="stat-label">总仓库数</p>
              <p class="stat-value">{{ pagination.total }}</p>
            </div>
          </div>
        </Card>
        <Card class="stat-card stat-enabled" :bordered="false">
          <div class="stat-content">
            <div class="stat-icon-wrap stat-icon-green">
              <Power />
            </div>
            <div class="stat-info">
              <p class="stat-label">已启用</p>
              <p class="stat-value">{{ enabledCount }}</p>
            </div>
          </div>
        </Card>
        <Card class="stat-card stat-disabled" :bordered="false">
          <div class="stat-content">
            <div class="stat-icon-wrap stat-icon-orange">
              <MapPin />
            </div>
            <div class="stat-info">
              <p class="stat-label">已停用</p>
              <p class="stat-value">{{ disabledCount }}</p>
            </div>
          </div>
        </Card>
        <Card class="stat-card stat-normal" :bordered="false">
          <div class="stat-content">
            <div class="stat-icon-wrap stat-icon-purple">
              <Thermometer />
            </div>
            <div class="stat-info">
              <p class="stat-label">常温仓库</p>
              <p class="stat-value">{{ normalTempCount }}</p>
            </div>
          </div>
        </Card>
      </div>

      <!-- Data Table -->
      <Card :bordered="false" class="table-card">
        <div class="toolbar">
          <Space wrap>
            <Popconfirm
              v-access:code="'base:warehouse:delete'"
              title="确认删除选中的仓库记录吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleBatchDelete"
            >
              <Button danger :disabled="selectedRowKeys.length === 0">删除</Button>
            </Popconfirm>
          </Space>
        </div>

        <Table
          row-key="id"
          :loading="loading"
          :columns="columns"
          :data-source="tableData"
          :pagination="pagination"
          :row-selection="rowSelection"
          :scroll="{ x: 1200 }"
          @change="handleTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'temperatureZone'">
              {{ formatTemperatureZone(record.temperatureZone) }}
            </template>
            <template v-else-if="column.key === 'qualityZone'">
              {{ formatQualityZone(record.qualityZone) }}
            </template>
            <template v-else-if="column.key === 'isEnabled'">
              <Switch
                :checked="record.isEnabled === 1"
                checked-children="启用"
                un-checked-children="停用"
                @change="(checked) => handleToggleStatus(record, checked)"
              />
            </template>
            <template v-else-if="column.key === 'action'">
              <Space>
                <Button
                  v-access:code="'base:warehouse:edit'"
                  type="link"
                  size="small"
                  @click="handleEdit(record)"
                >
                  编辑
                </Button>
                <Popconfirm
                  v-access:code="'base:warehouse:delete'"
                  title="确认删除该仓库记录吗？"
                  ok-text="确定"
                  cancel-text="取消"
                  @confirm="handleDelete(record)"
                >
                  <Button type="link" danger size="small">删除</Button>
                </Popconfirm>
              </Space>
            </template>
          </template>
        </Table>
      </Card>

      <Modal
        v-model:open="formVisible"
        :title="formMode === 'add' ? '新增仓库' : '编辑仓库'"
        :confirm-loading="submitting"
        :mask-closable="false"
        width="900px"
        @ok="handleSubmit"
        @cancel="handleCancel"
      >
        <Form ref="formRef" :model="formData" :rules="formRules" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
          <Row :gutter="16">
            <Col :span="8">
              <FormItem label="仓库编码" name="warehouseCode">
                <Input v-model:value="formData.warehouseCode" :disabled="formMode === 'edit'" maxlength="50" placeholder="请输入仓库编码" />
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label="仓库名称" name="warehouseName">
                <Input v-model:value="formData.warehouseName" :disabled="formMode === 'edit'" maxlength="100" placeholder="请输入仓库名称" />
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label="温度分区" name="temperatureZone">
                <Select v-model:value="formData.temperatureZone" :disabled="formMode === 'edit'" :options="temperatureZoneOptions" placeholder="请选择温度分区" />
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label="质量分区" name="qualityZone">
                <Select v-model:value="formData.qualityZone" :disabled="formMode === 'edit'" :options="qualityZoneOptions" placeholder="请选择质量分区" />
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
                <Select v-model:value="formData.company" :disabled="formMode === 'edit'" :options="companyOptions" placeholder="请选择所属公司" />
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
                <Input.TextArea v-model:value="formData.remark" :rows="3" maxlength="500" show-count placeholder="请输入备注" />
              </FormItem>
            </Col>
          </Row>
        </Form>

        <!-- 收货人信息区块 -->
        <div v-if="formMode === 'edit'" class="receiver-section">
          <div class="receiver-section-header">
            <div class="receiver-section-title">
              <User class="size-4" />
              <span>收货人信息</span>
            </div>
            <Button type="primary" size="small" @click="handleOpenReceiverModal">
              <template #icon><Plus /></template>
              管理收货人
            </Button>
          </div>
          <div v-if="receiverList.length === 0" class="receiver-empty">
            <span>暂无收货人信息</span>
          </div>
          <Table
            v-else
            :columns="receiverColumns"
            :data-source="receiverList"
            :loading="receiverLoading"
            row-key="id"
            :pagination="false"
            :scroll="{ x: 700 }"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'phoneNumber'">
                {{ maskPhone(record.phoneNumber) }}
              </template>
              <template v-else-if="column.key === 'address'">
                {{ record.province }}{{ record.city }}{{ record.district }}{{ record.detailedAddress }}
              </template>
              <template v-else-if="column.key === 'isDefault'">
                <Tag v-if="record.isDefault === 1" color="success">默认</Tag>
                <Button v-else type="link" size="small" @click="handleSetDefaultReceiver(record)">设为默认</Button>
              </template>
              <template v-else-if="column.key === 'action'">
                <Button type="link" size="small" danger @click="handleDeleteReceiver(record)">删除</Button>
              </template>
            </template>
          </Table>
        </div>
      </Modal>

      <!-- 收货人管理弹框 -->
      <Modal
        v-model:open="receiverModalVisible"
        :title="`${formData.warehouseCode} - ${formData.warehouseName} 收货人管理`"
        width="900px"
        :footer="null"
        :mask-closable="false"
      >
        <div class="receiver-modal-content">
          <div class="toolbar mb-4">
            <Button type="primary" @click="() => { editingReceiverId = undefined; receiverFormVisible = true; }">
              <template #icon><Plus /></template>
              添加收货人
            </Button>
          </div>
          <Table
            :columns="receiverColumns"
            :data-source="receiverList"
            :loading="receiverLoading"
            row-key="id"
            :pagination="false"
            :scroll="{ x: 700 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'phoneNumber'">
                {{ maskPhone(record.phoneNumber) }}
              </template>
              <template v-else-if="column.key === 'address'">
                {{ record.province }}{{ record.city }}{{ record.district }}{{ record.detailedAddress }}
              </template>
              <template v-else-if="column.key === 'isDefault'">
                <Tag v-if="record.isDefault === 1" color="success">默认</Tag>
                <Button v-else type="link" size="small" @click="handleSetDefaultReceiver(record)">设为默认</Button>
              </template>
              <template v-else-if="column.key === 'action'">
                <Space>
                  <Button type="link" size="small" @click="() => { editingReceiverId = record.id; receiverFormVisible = true; }">编辑</Button>
                  <Button type="link" danger size="small" @click="handleDeleteReceiver(record)">删除</Button>
                </Space>
              </template>
            </template>
          </Table>
        </div>
      </Modal>

      <!-- 收货人编辑抽屉 -->
      <Drawer
        v-model:open="receiverFormVisible"
        :title="editingReceiverId ? '编辑收货人' : '添加收货人'"
        width="520"
        :destroy-on-close="true"
      >
        <Form
          ref="receiverFormRef"
          :model="receiverFormData"
          :rules="receiverFormRules"
          layout="vertical"
        >
          <FormItem label="收货人" name="consignee">
            <Input v-model:value="receiverFormData.consignee" placeholder="请输入收货人姓名" allow-clear />
          </FormItem>
          <FormItem label="手机号码" name="phoneNumber">
            <Input v-model:value="receiverFormData.phoneNumber" placeholder="请输入手机号码" allow-clear maxlength="11" />
          </FormItem>
          <FormItem label="国家" name="country">
            <Select v-model:value="receiverFormData.country" disabled>
              <SelectOption value="中国">中国</SelectOption>
            </Select>
          </FormItem>
          <FormItem label="省/市/区" name="province">
            <Input placeholder="请输入省份" v-model:value="receiverFormData.province" allow-clear />
          </FormItem>
          <FormItem label="城市" name="city">
            <Input placeholder="请输入城市" v-model:value="receiverFormData.city" allow-clear />
          </FormItem>
          <FormItem label="区县" name="district">
            <Input placeholder="请输入区县" v-model:value="receiverFormData.district" allow-clear />
          </FormItem>
          <FormItem label="详细地址" name="detailedAddress">
            <Input.TextArea v-model:value="receiverFormData.detailedAddress" placeholder="请输入详细地址" :rows="2" allow-clear show-count :maxlength="500" />
          </FormItem>
          <FormItem label="邮编" name="postalCode">
            <Input v-model:value="receiverFormData.postalCode" placeholder="请输入邮编" allow-clear maxlength="6" />
          </FormItem>
          <FormItem name="isDefault">
            <Checkbox v-model:checked="receiverFormIsDefault">设为默认收货人</Checkbox>
          </FormItem>
        </Form>
        <template #footer>
          <div class="drawer-footer">
            <Button @click="receiverFormVisible = false">取消</Button>
            <Button type="primary" :loading="receiverSubmitting" @click="handleSaveReceiver">保存</Button>
          </div>
        </template>
      </Drawer>
    </div>
  </Page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Page } from '@vben/common-ui';
import {
  Plus,
  Search,
  Filter,
  Download,
  Warehouse,
  Power,
  MapPin,
  Thermometer,
  User,
} from 'lucide-vue-next';
import {
  Button,
  Card,
  Checkbox,
  CheckboxGroup,
  Col,
  Drawer,
  Form,
  FormItem,
  Input,
  Modal,
  Popconfirm,
  Popover,
  Radio,
  RadioGroup,
  Row,
  Select,
  SelectOption,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from 'ant-design-vue';
import type { FormInstance, TableColumnsType, TablePaginationConfig } from 'ant-design-vue';
import {
  deleteWarehouse,
  exportWarehouse,
  getWarehouseDetail,
  listWarehousePage,
  toggleWarehouseStatus,
  updateWarehouse,
  createWarehouse,
  type WarehouseQuery,
  type WarehouseResult,
} from '#/api/sys/warehouse';
import {
  getWarehouseReceiverList,
  deleteWarehouseReceiver,
  setDefaultWarehouseReceiver,
  createWarehouseReceiver,
  updateWarehouseReceiver,
  type WarehouseReceiverResult,
} from '#/api/sys/warehouse-receiver';

interface WarehouseForm extends Partial<WarehouseResult> {
  id?: number;
}

const loading = ref(false);
const submitting = ref(false);
const exporting = ref(false);
const formVisible = ref(false);
const formMode = ref<'add' | 'edit'>('add');
const tableData = ref<WarehouseResult[]>([]);
const selectedRowKeys = ref<Array<number | string>>([]);
const formRef = ref<FormInstance>();
const filterPopoverVisible = ref(false);
const selectedFilters = ref(['warehouseCode', 'warehouseName', 'company']);

// 收货人信息
const receiverModalVisible = ref(false);
const receiverList = ref<WarehouseReceiverResult[]>([]);
const receiverLoading = ref(false);
const editingReceiverId = ref<number | undefined>(undefined);

// 收货人表单
const receiverFormVisible = ref(false);
const receiverFormRef = ref<FormInstance>();
const receiverSubmitting = ref(false);
const receiverFormData = reactive({
  consignee: '',
  phoneNumber: '',
  country: '中国',
  province: '',
  city: '',
  district: '',
  detailedAddress: '',
  postalCode: '',
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

function maskPhone(phone: string) {
  if (!phone || phone.length !== 11) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(7)}`;
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
    if (formData.warehouseCode) {
      await loadReceiverList(formData.warehouseCode);
    }
  } catch (error) {
    // validation failed
  } finally {
    receiverSubmitting.value = false;
  }
}

const filterFieldOptions = [
  { label: '仓库编码', value: 'warehouseCode' },
  { label: '仓库名称', value: 'warehouseName' },
  { label: '所属公司', value: 'company' },
  { label: '温区', value: 'temperatureZone' },
  { label: '质量区', value: 'qualityZone' },
  { label: '状态', value: 'isEnabled' },
];

const queryForm = reactive<WarehouseQuery>({
  warehouseCode: '',
  warehouseName: '',
  company: '',
  temperatureZone: undefined,
  qualityZone: undefined,
  isEnabled: undefined,
});

const statusFilterOptions = [
  { label: '全部状态', value: undefined },
  { label: '启用', value: 1 },
  { label: '停用', value: 0 },
];

// Status options for popover filter (no "全部" option)
const statusValueOptions = [
  { label: '启用', value: 1 },
  { label: '停用', value: 0 },
];

// Stats computed
const enabledCount = computed(() => tableData.value.filter((item) => item.isEnabled === 1).length);
const disabledCount = computed(() => tableData.value.filter((item) => item.isEnabled === 0).length);
const normalTempCount = computed(() => tableData.value.filter((item) => item.temperatureZone === 'NORMAL').length);

const formData = reactive<WarehouseForm>(createDefaultForm());

const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total) => `共 ${total} 条`,
});

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

const columns = computed<TableColumnsType<WarehouseResult>>(() => [
  { title: '序号', key: 'index', width: 70, customRender: ({ index }) => `${((pagination.current || 1) - 1) * (pagination.pageSize || 10) + index + 1}` },
  { title: '仓库编码', dataIndex: 'warehouseCode', key: 'warehouseCode', width: 140 },
  { title: '仓库名称', dataIndex: 'warehouseName', key: 'warehouseName', width: 160 },
  { title: '所属公司', dataIndex: 'company', key: 'company', width: 160 },
  { title: '温区', dataIndex: 'temperatureZone', key: 'temperatureZone', width: 120 },
  { title: '质量区', dataIndex: 'qualityZone', key: 'qualityZone', width: 140 },
  { title: '状态', dataIndex: 'isEnabled', key: 'isEnabled', width: 110 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
  { title: '操作', key: 'action', fixed: 'right', width: 140 },
]);

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: Array<number | string>) => {
    selectedRowKeys.value = keys;
  },
}));

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

function normalizeQuery() {
  return {
    warehouseCode: queryForm.warehouseCode?.trim() || undefined,
    warehouseName: queryForm.warehouseName?.trim() || undefined,
    company: queryForm.company?.trim() || undefined,
    temperatureZone: queryForm.temperatureZone || undefined,
    qualityZone: queryForm.qualityZone || undefined,
    isEnabled: queryForm.isEnabled ?? undefined,
  };
}

async function loadData() {
  loading.value = true;
  try {
    const res = await listWarehousePage({
      pageNum: pagination.current || 1,
      pageSize: pagination.pageSize || 10,
      ...normalizeQuery(),
    });
    tableData.value = res.rows || [];
    pagination.total = res.total || 0;
  } catch (error: any) {
    tableData.value = [];
    pagination.total = 0;
    message.error(error?.message || '仓库列表加载失败');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.current = 1;
  loadData();
}

function handleReset() {
  queryForm.warehouseCode = '';
  queryForm.warehouseName = '';
  queryForm.company = '';
  queryForm.temperatureZone = undefined;
  queryForm.qualityZone = undefined;
  queryForm.isEnabled = undefined;
  selectedRowKeys.value = [];
  pagination.current = 1;
  loadData();
}

function handleTableChange(page: TablePaginationConfig) {
  pagination.current = page.current || 1;
  pagination.pageSize = page.pageSize || 10;
  loadData();
}

function handleAdd() {
  formMode.value = 'add';
  resetFormData();
  formVisible.value = true;
}

async function handleEdit(record: WarehouseResult) {
  formMode.value = 'edit';
  resetFormData();
  try {
    const detail = await getWarehouseDetail(record.id!);
    Object.assign(formData, detail || {}, { id: record.id });
    // 加载收货人列表
    if (detail?.warehouseCode) {
      await loadReceiverList(detail.warehouseCode);
    }
  } catch {
    Object.assign(formData, record || {});
  }
  formVisible.value = true;
}

async function handleDelete(record: WarehouseResult) {
  try {
    await deleteWarehouse(record.id!);
    message.success('删除成功');
    if (tableData.value.length === 1 && (pagination.current || 1) > 1) {
      pagination.current = (pagination.current || 1) - 1;
    }
    selectedRowKeys.value = selectedRowKeys.value.filter((key) => key !== record.id);
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '删除失败');
  }
}

async function handleBatchDelete() {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请先选择要删除的记录');
    return;
  }
  try {
    await Promise.all(selectedRowKeys.value.map((id) => deleteWarehouse(Number(id))));
    message.success('删除成功');
    selectedRowKeys.value = [];
    pagination.current = 1;
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '批量删除失败');
  }
}

async function handleToggleStatus(record: WarehouseResult, checked: boolean) {
  try {
    await toggleWarehouseStatus(record.id!, checked ? 1 : 0);
    message.success(checked ? '启用成功' : '停用成功');
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '状态切换失败');
    await loadData();
  }
}

async function handleExport() {
  exporting.value = true;
  try {
    const blob = await exportWarehouse(normalizeQuery());
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `仓库档案_${Date.now()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    message.success('导出成功');
  } catch (error: any) {
    message.error(error?.message || '导出失败');
  } finally {
    exporting.value = false;
  }
}

async function handleSubmit() {
  try {
    await formRef.value?.validate();
    submitting.value = true;
    if (formMode.value === 'edit') {
      await updateWarehouse(formData as WarehouseResult);
    } else {
      await createWarehouse(formData);
    }
    message.success(formMode.value === 'add' ? '新增成功' : '编辑成功');
    formVisible.value = false;
    await loadData();
  } catch (error: any) {
    if (error?.errorFields) {
      return;
    }
    message.error(error?.message || '提交失败');
  } finally {
    submitting.value = false;
  }
}

function handleCancel() {
  formVisible.value = false;
  formRef.value?.clearValidate();
}

function formatTemperatureZone(value?: string) {
  return temperatureZoneOptions.find((item) => item.value === value)?.label || value || '-';
}

function formatQualityZone(value?: string) {
  return qualityZoneOptions.find((item) => item.value === value)?.label || value || '-';
}

// 收货人列表相关
const receiverColumns = [
  { title: '收货人', dataIndex: 'consignee', key: 'consignee', width: 100 },
  { title: '手机号码', dataIndex: 'phoneNumber', key: 'phoneNumber', width: 130 },
  { title: '地址', key: 'address', width: 200 },
  { title: '邮编', dataIndex: 'postalCode', key: 'postalCode', width: 100 },
  { title: '默认', key: 'isDefault', width: 90, align: 'center' as const },
  { title: '备注', dataIndex: 'note', key: 'note', width: 120, ellipsis: true },
  { title: '操作', key: 'action', width: 120, fixed: 'right' as const },
];

async function loadReceiverList(warehouseCode: string) {
  receiverLoading.value = true;
  try {
    const res = await getWarehouseReceiverList({ warehouseCode });
    receiverList.value = res.data?.list || res.rows || res.data?.rows || [];
  } catch {
    receiverList.value = [];
  } finally {
    receiverLoading.value = false;
  }
}

function handleOpenReceiverModal() {
  if (formData.warehouseCode) {
    loadReceiverList(formData.warehouseCode);
    receiverModalVisible.value = true;
  }
}

function handleDeleteReceiver(record: WarehouseReceiverResult) {
  Modal.confirm({
    title: '确认删除',
    content: `确认删除收货人"${record.consignee}"吗？`,
    onOk: async () => {
      try {
        await deleteWarehouseReceiver(record.id);
        message.success('删除成功');
        if (formData.warehouseCode) {
          await loadReceiverList(formData.warehouseCode);
        }
      } catch (error: any) {
        message.error(error?.message || '删除失败');
      }
    },
  });
}

function handleSetDefaultReceiver(record: WarehouseReceiverResult) {
  Modal.confirm({
    title: '设为默认',
    content: `确认将"${record.consignee}"设为默认收货人吗？`,
    onOk: async () => {
      try {
        await setDefaultWarehouseReceiver(record.id);
        message.success('设置成功');
        if (formData.warehouseCode) {
          await loadReceiverList(formData.warehouseCode);
        }
      } catch (error: any) {
        message.error(error?.message || '设置失败');
      }
    },
  });
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.wms-warehouse-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Page Header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0 16px 0;
}

.header-left {
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

.page-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.header-right :deep(.ant-btn-primary) {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Filter Card */
.filter-card :deep(.ant-card-body) {
  padding: 16px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input-wrap {
  position: relative;
  flex: 1;
  min-width: 280px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #9ca3af;
  z-index: 1;
}

.search-input {
  padding-left: 36px !important;
}

.status-select {
  width: 140px;
}

.more-filters {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}

.filter-popover-content {
  width: 360px;
}

.filter-popover-title {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 12px;
}

.filter-checkbox-group {
  display: flex;
  flex-direction: column;
}

.filter-popover-divider {
  height: 1px;
  background-color: #f3f4f6;
  margin: 12px 0;
}

.filter-dynamic-inputs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-dynamic-inputs :deep(.ant-form-item) {
  margin-bottom: 0;
}

.filter-popover-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

/* Stats Row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card :deep(.ant-card-body) {
  padding: 16px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon-wrap :deep(svg) {
  width: 20px;
  height: 20px;
}

.stat-icon-blue {
  background-color: #eff6ff;
  color: #2563eb;
}

.stat-icon-green {
  background-color: #f0fdf4;
  color: #16a34a;
}

.stat-icon-orange {
  background-color: #fff7ed;
  color: #ea580c;
}

.stat-icon-purple {
  background-color: #faf5ff;
  color: #9333ea;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

.stat-value {
  font-size: 22px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  line-height: 1.2;
}

/* Table Card */
.table-card :deep(.ant-card-body) {
  padding: 0 16px 16px 16px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.search-card :deep(.ant-card-body),
.wms-warehouse-page :deep(.ant-card-body) {
  padding: 16px;
}

.search-form {
  row-gap: 12px;
}

/* Responsive */
@media (max-width: 1024px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
}

/* 收货人信息区块 */
.receiver-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

.receiver-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.receiver-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  color: #1f2937;
}

.receiver-empty {
  text-align: center;
  padding: 32px 0;
  color: #9ca3af;
  font-size: 14px;
}

/* 收货人管理弹框 */
.receiver-modal-content {
  padding: 16px 0;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
