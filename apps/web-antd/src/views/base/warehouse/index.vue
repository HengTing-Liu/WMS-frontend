<template>
  <Page auto-content-height>
    <div style="display:none" data-page="warehouse">Warehouse Page Loaded</div>
    <div class="p-4">
      <!-- 页面标题区 -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">WMS0010 仓库档案</h1>
          <p class="mt-1 text-sm text-gray-500">管理仓库基本信息、温区、质检分区等</p>
        </div>
        <Button type="primary" size="large" @click="handleEdit()">
          <IconifyIcon icon="material-symbols:add" class="mr-1" /> 新建仓库
        </Button>
      </div>

      <!-- 统计卡片区域 -->
      <div class="mb-6 grid grid-cols-4 gap-4">
        <Card class="stat-card">
          <div class="flex items-center">
            <div class="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <IconifyIcon icon="material-symbols:warehouse" class="text-xl text-blue-600" />
            </div>
            <div>
              <div class="text-sm text-gray-500">总仓库数</div>
              <div class="text-2xl font-bold text-gray-800">{{ stats.totalCount }}</div>
            </div>
          </div>
        </Card>
        <Card class="stat-card">
          <div class="flex items-center">
            <div class="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <IconifyIcon icon="material-symbols:check-circle" class="text-xl text-green-600" />
            </div>
            <div>
              <div class="text-sm text-gray-500">已启用</div>
              <div class="text-2xl font-bold text-gray-800">{{ stats.enabledCount }}</div>
            </div>
          </div>
        </Card>
        <Card class="stat-card">
          <div class="flex items-center">
            <div class="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <IconifyIcon icon="material-symbols:inventory-2" class="text-xl text-purple-600" />
            </div>
            <div>
              <div class="text-sm text-gray-500">总容量</div>
              <div class="text-2xl font-bold text-gray-800">{{ stats.totalCapacity }}</div>
            </div>
          </div>
        </Card>
        <Card class="stat-card">
          <div class="flex items-center">
            <div class="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <IconifyIcon icon="material-symbols:trending-up" class="text-xl text-orange-600" />
            </div>
            <div>
              <div class="text-sm text-gray-500">平均使用率</div>
              <div class="text-2xl font-bold text-gray-800">{{ stats.avgUsageRate }}%</div>
            </div>
          </div>
        </Card>
      </div>

      <!-- 搜索栏 - 使用 WmsSearchBar（字段由远程接口加载） -->
      <Card class="mb-4">
        <WmsSearchBar
          v-model="searchForm"
          :remote-fields-url="remoteFieldsUrl"
          cache-key="warehouse-fields-cache"
          @search="handleSearch"
          @reset="handleReset"
        />
      </Card>

      <!-- 工具栏 -->
      <div class="mb-4 flex items-center justify-between">
        <div class="text-sm text-gray-500">
          已选择 <span class="font-medium text-blue-600">{{ selectedRowKeys.length }}</span> 项
        </div>
        <div class="flex gap-2">
          <Button @click="handleExport">
            <IconifyIcon icon="material-symbols:download" class="mr-1" /> 导出
          </Button>
          <Popconfirm title="是否确认批量删除?" ok-text="确认" cancel-text="取消" @confirm="handleBatchDelete">
            <Button danger :disabled="selectedRowKeys.length === 0">
              <IconifyIcon icon="material-symbols:delete" class="mr-1" /> 批量删除
            </Button>
          </Popconfirm>
        </div>
      </div>

      <!-- 表格 - 使用 WmsDataTable -->
      <WmsDataTable
        :columns="columns"
        :data-source="dataList"
        :loading="loading"
        :pagination="paginationConfig"
        row-key="id"
        :enable-selection="true"
        @page-change="onPageChange"
        @selection-change="onSelectionChange"
      >
        <template #bodyCell="{ column, record, index }">
          <!-- 序号 -->
          <template v-if="column.key === 'seq'">
            {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
          </template>

          <!-- 仓库名称带图标 -->
          <template v-else-if="column.key === 'warehouseName'">
            <div class="flex items-center gap-2">
              <div class="flex h-8 w-8 items-center justify-center rounded bg-blue-100">
                <IconifyIcon icon="material-symbols:warehouse" class="text-blue-600" />
              </div>
              <span>{{ record.warehouseName }}</span>
            </div>
          </template>

          <!-- 类型标签 -->
          <template v-else-if="column.key === 'warehouseType'">
            <Tag :color="getTypeColor(record.warehouseType)">
              {{ getTypeLabel(record.warehouseType) }}
            </Tag>
          </template>

          <!-- 温区显示 -->
          <template v-else-if="column.key === 'temperatureZone'">
            <div class="flex items-center gap-1">
              <IconifyIcon :icon="getTempIcon(record.temperatureZone)" class="text-gray-500" />
              <span>{{ getTempLabel(record.temperatureZone) }}</span>
            </div>
          </template>

          <!-- 质检分区 -->
          <template v-else-if="column.key === 'qualityZone'">
            <Tag :color="getQualityZoneColor(record.qualityZone)" size="small">
              {{ record.qualityZone || '-' }}
            </Tag>
          </template>

          <!-- 使用率进度条 -->
          <template v-else-if="column.key === 'usageRate'">
            <div class="w-24">
              <Progress
                :percent="record.usageRate || 0"
                size="small"
                :status="getUsageStatus(record.usageRate)"
                :stroke-color="getUsageColor(record.usageRate)"
              />
            </div>
          </template>

          <!-- 状态标签 -->
          <template v-else-if="column.key === 'isEnabled'">
            <Tag :color="record.isEnabled === 1 ? 'success' : 'default'">
              {{ record.isEnabled === 1 ? '启用' : '停用' }}
            </Tag>
          </template>

          <!-- 操作按钮 -->
          <template v-else-if="column.key === 'action'">
            <div class="flex items-center gap-2">
              <Tooltip title="收货地址">
                <Button type="link" size="small" class="p-0" @click="openReceiverModal(record)">
                  <IconifyIcon icon="material-symbols:location-on" class="text-lg" />
                </Button>
              </Tooltip>

              <Tooltip title="编辑">
                <Button type="link" size="small" class="p-0" @click="handleEdit(record)">
                  <IconifyIcon icon="material-symbols:edit" class="text-lg" />
                </Button>
              </Tooltip>

              <Tooltip :title="record.isEnabled === 1 ? '停用' : '启用'">
                <Button
                  type="link"
                  size="small"
                  class="p-0"
                  @click="handleChangeStatus(record, record.isEnabled !== 1)"
                >
                  <IconifyIcon
                    :icon="record.isEnabled === 1 ? 'material-symbols:toggle-on' : 'material-symbols:toggle-off'"
                    :class="record.isEnabled === 1 ? 'text-green-500 text-2xl' : 'text-gray-400 text-2xl'"
                  />
                </Button>
              </Tooltip>

              <Tooltip title="删除">
                <Popconfirm title="是否确认删除?" ok-text="确认" cancel-text="取消" @confirm="handleDelete(record.id)">
                  <Button type="link" size="small" danger class="p-0">
                    <IconifyIcon icon="material-symbols:delete" class="text-lg" />
                  </Button>
                </Popconfirm>
              </Tooltip>
            </div>
          </template>
        </template>
      </WmsDataTable>
    </div>

    <!-- 新增/修改弹窗 -->
    <Modal v-model:open="modalVisible" :title="modalTitle" @ok="handleSubmit" width="600px">
      <Form :model="formData" :label-col="{ span: 6 }">
        <FormItem label="仓库编码" name="warehouseCode" required>
          <Input v-model:value="formData.warehouseCode" placeholder="请输入仓库编码" />
        </FormItem>
        <FormItem label="仓库名称" name="warehouseName" required>
          <Input v-model:value="formData.warehouseName" placeholder="请输入仓库名称" />
        </FormItem>
        <FormItem label="所属公司" name="company" required>
          <Input v-model:value="formData.company" placeholder="请输入所属公司" />
        </FormItem>
        <FormItem label="温度区" name="temperatureZone">
          <Input v-model:value="formData.temperatureZone" placeholder="如：常温区、冷藏区" />
        </FormItem>
        <FormItem label="质量区" name="qualityZone">
          <Input v-model:value="formData.qualityZone" placeholder="如：合格品区" />
        </FormItem>
        <FormItem label="状态" name="isEnabled">
          <Switch v-model:checked="formData.isEnabled" checked-children="启用" un-checked-children="停用" />
        </FormItem>
        <FormItem label="备注" name="remark">
          <Textarea v-model:value="formData.remark" placeholder="请输入备注" :rows="3" />
        </FormItem>
      </Form>
    </Modal>

    <!-- 收货地址管理弹窗 -->
    <Modal
      v-model:open="receiverModalVisible"
      :title="`收货地址管理 - ${currentWarehouseName}`"
      width="800px"
      :footer="null"
    >
      <div class="mb-4 flex justify-between items-center">
        <Button type="primary" size="small" @click="handleAddReceiver">
          <IconifyIcon icon="material-symbols:add" class="mr-1" /> 新增收货地址
        </Button>
      </div>

      <!-- 收货地址列表 -->
      <Table
        :columns="receiverColumns"
        :data-source="receiverList"
        :loading="receiverLoading"
        :pagination="false"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'isDefault'">
            <Tag :color="record.isDefault === 1 ? 'success' : 'default'">
              {{ record.isDefault === 1 ? '默认' : '' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'address'">
            {{ formatFullAddress(record) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <div class="flex items-center gap-2">
              <Button type="link" size="small" class="p-0" @click="handleEditReceiver(record)">
                <IconifyIcon icon="material-symbols:edit" class="text-lg" />
              </Button>
              <Button
                v-if="record.isDefault !== 1"
                type="link"
                size="small"
                class="p-0"
                @click="handleSetDefaultReceiver(record)"
              >
                <IconifyIcon icon="material-symbols:star-outline" class="text-lg" />
              </Button>
              <Popconfirm
                title="是否确认删除?"
                ok-text="确认"
                cancel-text="取消"
                @confirm="handleDeleteReceiver(record.id)"
              >
                <Button type="link" size="small" danger class="p-0">
                  <IconifyIcon icon="material-symbols:delete" class="text-lg" />
                </Button>
              </Popconfirm>
            </div>
          </template>
        </template>
      </Table>

      <!-- 收货地址表单弹窗 -->
      <Modal
        v-model:open="receiverFormVisible"
        :title="receiverFormTitle"
        @ok="handleSubmitReceiver"
        width="600px"
      >
        <Form :model="receiverFormData" :label-col="{ span: 6 }">
          <FormItem label="收货人" name="consignee" required>
            <Input v-model:value="receiverFormData.consignee" placeholder="请输入收货人姓名" />
          </FormItem>
          <FormItem label="手机号码" name="phoneNumber" required>
            <Input v-model:value="receiverFormData.phoneNumber" placeholder="请输入手机号码" />
          </FormItem>
          <FormItem label="国家" name="country">
            <Input v-model:value="receiverFormData.country" placeholder="请输入国家" />
          </FormItem>
          <FormItem label="省份" name="province">
            <Input v-model:value="receiverFormData.province" placeholder="请输入省份" />
          </FormItem>
          <FormItem label="城市" name="city">
            <Input v-model:value="receiverFormData.city" placeholder="请输入城市" />
          </FormItem>
          <FormItem label="区县" name="district">
            <Input v-model:value="receiverFormData.district" placeholder="请输入区县" />
          </FormItem>
          <FormItem label="详细地址" name="detailedAddress" required>
            <Textarea v-model:value="receiverFormData.detailedAddress" placeholder="请输入详细地址" :rows="2" />
          </FormItem>
          <FormItem label="邮政编码" name="postalCode">
            <Input v-model:value="receiverFormData.postalCode" placeholder="请输入邮政编码" />
          </FormItem>
          <FormItem label="设为默认" name="isDefault">
            <Switch v-model:checked="receiverFormData.isDefault" checked-children="是" un-checked-children="否" />
          </FormItem>
        </Form>
      </Modal>
    </Modal>
  </Page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { Button, Switch, Popconfirm, Modal, Form, FormItem, Input, Textarea, Select, SelectOption, Card, Progress, Tag, Tooltip, Table } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { Page } from '@vben/common-ui';

import {
  getWarehouseListApi,
  addWarehouseApi,
  updateWarehouseApi,
  deleteWarehouseApi,
  exportWarehouseApi,
  getWarehouseReceiverListApi,
  addWarehouseReceiverApi,
  updateWarehouseReceiverApi,
  deleteWarehouseReceiverApi,
  setWarehouseReceiverDefaultApi,
} from '#/api/core/warehouse';
import WmsSearchBar from '#/components/common/WmsSearchBar.vue';
import WmsDataTable from '#/components/common/WmsDataTable.vue';

const columns = [
  { title: '序号', key: 'seq', width: 60, align: 'center' },
  { title: '仓库编号', dataIndex: 'warehouseCode', width: 100, align: 'center' },
  { title: '仓库名称', key: 'warehouseName', width: 180 },
  { title: '类型', key: 'warehouseType', width: 100, align: 'center' },
  { title: '温区', key: 'temperatureZone', width: 120, align: 'center' },
  { title: '质检分区', key: 'qualityZone', width: 100, align: 'center' },
  { title: '负责人', dataIndex: 'managerName', width: 100, align: 'center' },
  { title: '使用率', key: 'usageRate', width: 120, align: 'center' },
  { title: '状态', key: 'isEnabled', width: 80, align: 'center' },
  { title: '操作', key: 'action', width: 120, align: 'center', fixed: 'right' },
];

const dataList = ref<any[]>([]);
const loading = ref(false);
const selectedRowKeys = ref<any[]>([]);

// 统计数据
const stats = reactive({
  totalCount: 0,
  enabledCount: 0,
  totalCapacity: '0㎡',
  avgUsageRate: 0,
});

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

// 搜索表单（默认筛选已启用的仓库）
const searchForm = reactive({
  keyword: '',
  warehouseCode: '',
  warehouseName: '',
  company: undefined as string | undefined,
  isEnabled: 1, // 默认已启用（数字格式，后端需要）
});

// 远程字段接口 URL（后端根据 dict_type 自动加载下拉选项）
const remoteFieldsUrl = '/api/system/meta/column/schema?tableCode=sys_warehouse';

// 弹窗
const modalVisible = ref(false);
const modalTitle = ref('新增仓库');
const isEdit = ref(false);
const formData = reactive({
  id: undefined as number | undefined,
  warehouseCode: '',
  warehouseName: '',
  company: '',
  temperatureZone: '',
  qualityZone: '',
  isEnabled: true,
  remark: '',
});

// ==================== 收货地址管理 ====================
const currentWarehouseCode = ref('');
const currentWarehouseName = ref('');
const receiverModalVisible = ref(false);
const receiverFormVisible = ref(false);
const receiverFormTitle = ref('新增收货地址');
const isEditReceiver = ref(false);
const receiverLoading = ref(false);
const receiverList = ref<any[]>([]);
const receiverColumns = [
  { title: '收货人', dataIndex: 'consignee', key: 'consignee', width: 100 },
  { title: '手机号码', dataIndex: 'phoneNumber', key: 'phoneNumber', width: 130 },
  { title: '收货地址', key: 'address', minWidth: 200 },
  { title: '默认', key: 'isDefault', width: 70, align: 'center' as const },
  { title: '操作', key: 'action', width: 120, align: 'center' as const },
];

const receiverFormData = reactive({
  id: undefined as number | undefined,
  warehouseCode: '',
  consignee: '',
  phoneNumber: '',
  country: '',
  province: '',
  city: '',
  district: '',
  detailedAddress: '',
  postalCode: '',
  isDefault: false,
});

// 加载列表
async function loadData() {
  loading.value = true;
  try {
    const sf = searchForm as Record<string, any>;
    const params: Record<string, any> = {
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
    };

    // 直接从 searchForm 取值（已经是驼峰格式）
    if (sf.warehouseCode) params.warehouseCode = sf.warehouseCode;
    if (sf.warehouseName) params.warehouseName = sf.warehouseName;
    if (sf.company) params.company = sf.company;

    // 后端参数名是 enabled
    const enabledVal = sf.isEnabled ?? sf.is_enabled ?? 1;
    params.enabled = typeof enabledVal === 'boolean' ? (enabledVal ? 1 : 0) : Number(enabledVal);

    const res = await getWarehouseListApi(params);
    dataList.value = res.rows || res.data?.rows || [];
    pagination.total = res.total || res.data?.total || 0;
  } catch (e) {
    console.error('加载失败', e);
  } finally {
    loading.value = false;
  }
}

// 蛇形转驼峰映射
const snakeToCamelMap: Record<string, string> = {
  warehouse_code: 'warehouseCode',
  warehouse_name: 'warehouseName',
  is_enabled: 'isEnabled',
};

function handleSearch(formFromBar?: Record<string, any>) {
  if (formFromBar && typeof formFromBar === 'object') {
    const converted: Record<string, any> = {};
    for (const [key, value] of Object.entries(formFromBar)) {
      const camelKey = snakeToCamelMap[key] || key;
      converted[camelKey] = value;
    }
    Object.assign(searchForm, converted);
  }
  pagination.current = 1;
  loadData();
}

// 重置：恢复默认筛选条件（已启用仓库）
function handleReset() {
  // 先重置 WmsSearchBar 内部状态
  // 然后同步父组件状态
  nextTick(() => {
    searchForm.keyword = '';
    searchForm.warehouseCode = '';
    searchForm.warehouseName = '';
    searchForm.company = undefined;
    searchForm.isEnabled = 1;
    pagination.current = 1;
    loadData();
  });
}

// WmsDataTable 分页配置（适配组件接口）
const paginationConfig = computed(() => ({
  current: pagination.current,
  pageSize: pagination.pageSize,
  total: pagination.total,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
}));

// WmsDataTable 事件处理
function onPageChange({ page, pageSize }: { page: number; pageSize: number }) {
  pagination.current = page;
  pagination.pageSize = pageSize;
  loadData();
}

function onSelectionChange(keys: any[]) {
  selectedRowKeys.value = keys;
}

// 新增/修改
function handleEdit(row?: any) {
  if (row) {
    isEdit.value = true;
    modalTitle.value = '修改仓库';
    Object.assign(formData, row, { isEnabled: row.isEnabled === 1 });
  } else {
    isEdit.value = false;
    modalTitle.value = '新增仓库';
    Object.assign(formData, {
      id: undefined,
      warehouseCode: '',
      warehouseName: '',
      company: '',
      temperatureZone: '',
      qualityZone: '',
      isEnabled: true,
      remark: '',
    });
  }
  modalVisible.value = true;
}

// 提交
async function handleSubmit() {
  try {
    const data = {
      ...formData,
      isEnabled: formData.isEnabled ? 1 : 0,
    };
    if (isEdit.value) {
      await updateWarehouseApi(data);
      message.success('修改成功');
    } else {
      await addWarehouseApi(data);
      message.success('新增成功');
    }
    modalVisible.value = false;
    loadData();
  } catch (e: any) {
    message.error(e.message || '操作失败');
  }
}

// 删除
async function handleDelete(id: number) {
  try {
    await deleteWarehouseApi(id);
    message.success('删除成功');
    loadData();
  } catch (e: any) {
    message.error(e.message || '删除失败');
  }
}

// 批量删除
async function handleBatchDelete() {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择要删除的数据');
    return;
  }
  try {
    for (const id of selectedRowKeys.value) {
      await deleteWarehouseApi(id);
    }
    message.success('删除成功');
    selectedRowKeys.value = [];
    loadData();
  } catch (e: any) {
    message.error(e.message || '删除失败');
  }
}

// 状态切换
async function handleChangeStatus(record: any, checked: boolean) {
  try {
    await updateWarehouseApi({
      ...record,
      isEnabled: checked ? 1 : 0,
    });
    message.success('状态更新成功');
    loadData();
  } catch (e: any) {
    message.error(e.message || '状态更新失败');
    loadData();
  }
}

// 辅助函数：获取仓库类型标签
function getTypeLabel(type: string): string {
  const typeMap: Record<string, string> = {
    sales: '销售仓',
    isolation: '隔离仓',
    front: '前置仓',
    transit: '中转仓',
    return: '退货仓',
  };
  return typeMap[type] || type || '-';
}

// 辅助函数：获取仓库类型颜色
function getTypeColor(type: string): string {
  const colorMap: Record<string, string> = {
    sales: 'blue',
    isolation: 'red',
    front: 'green',
    transit: 'orange',
    return: 'purple',
  };
  return colorMap[type] || 'default';
}

// 辅助函数：获取温区标签
function getTempLabel(temp: string): string {
  const tempMap: Record<string, string> = {
    normal: '常温',
    cold: '2-8℃',
    frozen: '-18℃',
    ultraCold: '-40℃',
  };
  return tempMap[temp] || temp || '-';
}

// 辅助函数：获取温区图标
function getTempIcon(temp: string): string {
  const iconMap: Record<string, string> = {
    normal: 'material-symbols:thermometer',
    cold: 'material-symbols:ac-unit',
    frozen: 'material-symbols:snowing',
    ultraCold: 'material-symbols:snowing-heavy',
  };
  return iconMap[temp] || 'material-symbols:thermometer';
}

// 辅助函数：获取使用率状态
function getUsageStatus(rate: number): string {
  if (!rate) return 'normal';
  if (rate >= 80) return 'exception';
  if (rate >= 50) return 'active';
  return 'success';
}

// 辅助函数：获取使用率颜色
function getUsageColor(rate: number): string {
  if (!rate) return '#52c41a';
  if (rate >= 80) return '#ff4d4f';
  if (rate >= 50) return '#faad14';
  return '#52c41a';
}

// 辅助函数：获取质检分区颜色
function getQualityZoneColor(zone: string): string {
  const colorMap: Record<string, string> = {
    '合格区': 'success',
    '待检区': 'warning',
    '隔离区': 'error',
    '不合格区': 'default',
  };
  return colorMap[zone] || 'default';
}

// ==================== 收货地址管理方法 ====================

// 打开收货地址弹窗
function openReceiverModal(record: any) {
  currentWarehouseCode.value = record.warehouseCode;
  currentWarehouseName.value = record.warehouseName;
  receiverModalVisible.value = true;
  loadReceiverList();
}

// 加载收货地址列表
async function loadReceiverList() {
  receiverLoading.value = true;
  try {
    const res = await getWarehouseReceiverListApi(currentWarehouseCode.value);
    receiverList.value = res.data || [];
  } catch (e) {
    console.error('加载收货地址失败', e);
  } finally {
    receiverLoading.value = false;
  }
}

// 新增收货地址
function handleAddReceiver() {
  isEditReceiver.value = false;
  receiverFormTitle.value = '新增收货地址';
  Object.assign(receiverFormData, {
    id: undefined,
    warehouseCode: currentWarehouseCode.value,
    consignee: '',
    phoneNumber: '',
    country: '',
    province: '',
    city: '',
    district: '',
    detailedAddress: '',
    postalCode: '',
    isDefault: false,
  });
  receiverFormVisible.value = true;
}

// 编辑收货地址
function handleEditReceiver(record: any) {
  isEditReceiver.value = true;
  receiverFormTitle.value = '编辑收货地址';
  Object.assign(receiverFormData, record, {
    isDefault: record.isDefault === 1,
  });
  receiverFormVisible.value = true;
}

// 提交收货地址表单
async function handleSubmitReceiver() {
  try {
    const data = {
      ...receiverFormData,
      isDefault: receiverFormData.isDefault ? 1 : 0,
    };
    if (isEditReceiver.value) {
      await updateWarehouseReceiverApi(data);
      message.success('修改成功');
    } else {
      await addWarehouseReceiverApi(data);
      message.success('新增成功');
    }
    receiverFormVisible.value = false;
    loadReceiverList();
  } catch (e: any) {
    message.error(e.message || '操作失败');
  }
}

// 删除收货地址
async function handleDeleteReceiver(id: number) {
  try {
    await deleteWarehouseReceiverApi(id);
    message.success('删除成功');
    loadReceiverList();
  } catch (e: any) {
    message.error(e.message || '删除失败');
  }
}

// 设为默认收货地址
async function handleSetDefaultReceiver(record: any) {
  try {
    await setWarehouseReceiverDefaultApi(record.id);
    message.success('设置成功');
    loadReceiverList();
  } catch (e: any) {
    message.error(e.message || '设置失败');
  }
}

// 格式化完整地址
function formatFullAddress(record: any): string {
  const parts = [record.country, record.province, record.city, record.district, record.detailedAddress];
  return parts.filter(Boolean).join('');
}

// 导出功能
async function handleExport() {
  try {
    const sf = searchForm as Record<string, any>;
    const params: Record<string, any> = {};
    if (sf.warehouseCode) params.warehouseCode = sf.warehouseCode;
    if (sf.warehouseName) params.warehouseName = sf.warehouseName;
    if (sf.company) params.company = sf.company;
    const enabledVal = sf.isEnabled ?? sf.is_enabled ?? 1;
    params.enabled = typeof enabledVal === 'boolean' ? (enabledVal ? 1 : 0) : Number(enabledVal);

    const res = await exportWarehouseApi(params);
    const blob = res as Blob;

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `仓库档案_${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_')}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);

    message.success('导出成功');
  } catch (e: any) {
    console.error('导出失败:', e);
    const errMsg = e?.response?.data?.message || e?.message || '导出失败';
    message.error(errMsg);
  }
}

// 更新统计数据
function updateStats() {
  stats.totalCount = dataList.value.length;
  stats.enabledCount = dataList.value.filter((item: any) => item.isEnabled === 1).length;
  // 模拟数据，实际应从接口获取
  stats.totalCapacity = '12,500㎡';
  stats.avgUsageRate = 67;
}

onMounted(() => {
  loadData();
});
</script>
