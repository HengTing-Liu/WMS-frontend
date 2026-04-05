<template>
  <Page auto-content-height>
    <div style="display:none" data-page="material">Material Page Loaded</div>
    <div class="p-4">
      <!-- 页面标题区 -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">{{ $t('page.wms.material.listTitle') }}</h1>
          <p class="mt-1 text-sm text-gray-500">{{ $t('page.wms.material.listDescription') }}</p>
        </div>
        <Button type="primary" size="large" @click="handleAdd">
          <IconifyIcon icon="material-symbols:add" class="mr-1" /> {{ $t('page.wms.material.add') }}
        </Button>
      </div>

      <!-- 统计卡片区域 -->
      <div class="mb-6 grid grid-cols-4 gap-4">
        <Card class="stat-card">
          <div class="flex items-center">
            <div class="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <IconifyIcon icon="material-symbols:inventory-2" class="text-xl text-blue-600" />
            </div>
            <div>
              <div class="text-sm text-gray-500">{{ $t('page.wms.material.stats.total') }}</div>
              <div class="text-2xl font-bold text-gray-800">{{ pagination.total }}</div>
            </div>
          </div>
        </Card>
        <Card class="stat-card">
          <div class="flex items-center">
            <div class="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <IconifyIcon icon="material-symbols:check-circle" class="text-xl text-green-600" />
            </div>
            <div>
              <div class="text-sm text-gray-500">{{ $t('page.wms.material.stats.enabled') }}</div>
              <div class="text-2xl font-bold text-gray-800">{{ enabledCount }}</div>
            </div>
          </div>
        </Card>
        <Card class="stat-card">
          <div class="flex items-center">
            <div class="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <IconifyIcon icon="material-symbols:ban" class="text-xl text-orange-600" />
            </div>
            <div>
              <div class="text-sm text-gray-500">{{ $t('page.wms.material.stats.disabled') }}</div>
              <div class="text-2xl font-bold text-gray-800">{{ disabledCount }}</div>
            </div>
          </div>
        </Card>
        <Card class="stat-card">
          <div class="flex items-center">
            <div class="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <IconifyIcon icon="material-symbols:layers" class="text-xl text-purple-600" />
            </div>
            <div>
              <div class="text-sm text-gray-500">{{ $t('page.wms.material.stats.category') }}</div>
              <div class="text-2xl font-bold text-gray-800">{{ categoryCount }}</div>
            </div>
          </div>
        </Card>
      </div>

      <!-- 搜索栏 - 使用 WmsSearchBar（字段由远程接口加载） -->
      <Card class="mb-4">
        <WmsSearchBar
          v-model="searchForm"
          :remote-fields-url="remoteFieldsUrl"
          cache-key="material-fields-cache"
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
          <Popconfirm
            :title="$t('page.wms.material.batchDeleteConfirm')"
            :ok-text="$t('page.common.confirm')"
            :cancel-text="$t('page.common.cancel')"
            @confirm="handleBatchDelete"
          >
            <Button danger :disabled="selectedRowKeys.length === 0">
              <IconifyIcon icon="material-symbols:delete" class="mr-1" /> {{ $t('page.common.delete') }}
            </Button>
          </Popconfirm>
        </div>
      </div>

      <!-- 表格 -->
      <WmsDataTable
        :columns="columns"
        :data-source="tableData"
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

          <!-- 状态标签 -->
          <template v-else-if="column.key === 'isEnabled'">
            <Tag :color="record.isEnabled === 1 ? 'success' : 'default'">
              {{ record.isEnabled === 1 ? $t('page.common.enabled') : $t('page.common.disabled') }}
            </Tag>
          </template>

          <!-- 操作按钮 -->
          <template v-else-if="column.key === 'action'">
            <div class="flex items-center gap-2">
              <Tooltip :title="$t('page.common.edit')">
                <Button type="link" size="small" class="p-0" @click="handleEdit(record)">
                  <IconifyIcon icon="material-symbols:edit" class="text-lg" />
                </Button>
              </Tooltip>

              <Tooltip :title="record.isEnabled === 1 ? $t('page.wms.material.messages.disableSuccess') : $t('page.wms.material.messages.enableSuccess')">
                <Button type="link" size="small" class="p-0" @click="handleToggleStatus(record, record.isEnabled !== 1)">
                  <IconifyIcon
                    :icon="record.isEnabled === 1 ? 'material-symbols:toggle-on' : 'material-symbols:toggle-off'"
                    :class="record.isEnabled === 1 ? 'text-green-500 text-2xl' : 'text-gray-400 text-2xl'"
                  />
                </Button>
              </Tooltip>

              <Tooltip :title="$t('page.common.delete')">
                <Popconfirm
                  :title="$t('page.wms.material.deleteConfirm')"
                  :ok-text="$t('page.common.confirm')"
                  :cancel-text="$t('page.common.cancel')"
                  @confirm="handleDelete(record.id)"
                >
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
    <MaterialModal
      v-model:open="modalVisible"
      :material-id="currentEditId"
      @success="handleModalSuccess"
    />
  </Page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { Button, Switch, Popconfirm, Card, Progress, Tag, Tooltip } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { Page } from '@vben/common-ui';

import {
  deleteMaterial,
  exportMaterial,
  listMaterialPage,
  toggleMaterialStatus,
} from '#/api/sys/material';
import WmsSearchBar from '#/components/common/WmsSearchBar.vue';
import WmsDataTable from '#/components/common/WmsDataTable.vue';
import MaterialModal from './components/material-modal.vue';
import { $t } from '@vben/locales';

const columns = [
  { title: $t('page.common.seq'), key: 'seq', width: 60, align: 'center' },
  { title: $t('page.wms.material.columns.materialCode'), dataIndex: 'materialCode', key: 'materialCode', width: 140 },
  { title: $t('page.wms.material.columns.materialName'), dataIndex: 'materialName', key: 'materialName', width: 180 },
  { title: $t('page.wms.material.columns.specification'), dataIndex: 'specification', key: 'specification', width: 160 },
  { title: $t('page.wms.material.columns.unit'), dataIndex: 'unit', key: 'unit', width: 80 },
  { title: $t('page.wms.material.columns.category'), dataIndex: 'category', key: 'category', width: 120 },
  { title: $t('page.common.status'), key: 'isEnabled', width: 80, align: 'center' },
  { title: $t('page.wms.material.columns.createTime'), dataIndex: 'createTime', key: 'createTime', width: 170 },
  { title: $t('page.common.operation'), key: 'action', width: 130, align: 'center', fixed: 'right' },
];

const tableData = ref<any[]>([]);
const loading = ref(false);
const selectedRowKeys = ref<any[]>([]);

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

// 搜索表单
const searchForm = reactive({
  materialCode: '',
  materialName: '',
  specification: '',
  unit: '',
  category: '',
  status: undefined as number | undefined,
  isEnabled: undefined as number | undefined,
  is_enabled: undefined as number | undefined,
});

// 远程字段接口 URL
const remoteFieldsUrl = '/api/system/meta/column/schema?tableCode=sys_material';

// 弹窗
const modalVisible = ref(false);
const currentEditId = ref<number>();

// 统计数据
const enabledCount = computed(() => tableData.value.filter((item) => item.isEnabled === 1).length);
const disabledCount = computed(() => tableData.value.filter((item) => item.isEnabled === 0).length);
const categoryCount = computed(() => new Set(tableData.value.map((item) => item.category).filter(Boolean)).size);

// WmsDataTable 分页配置
const paginationConfig = computed(() => ({
  current: pagination.current,
  pageSize: pagination.pageSize,
  total: pagination.total,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
}));

// 加载列表
async function loadData() {
  loading.value = true;
  try {
    const sf = searchForm as Record<string, any>;
    const params: Record<string, any> = {
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
    };
    const mc = sf.material_code ?? sf.materialCode;
    if (mc !== '' && mc !== undefined && mc !== null) params.materialCode = mc;
    const mn = sf.material_name ?? sf.materialName;
    if (mn !== '' && mn !== undefined && mn !== null) params.materialName = mn;
    const spec = sf.specification;
    if (spec !== '' && spec !== undefined && spec !== null) params.specification = spec;
    const unit = sf.unit;
    if (unit !== '' && unit !== undefined && unit !== null) params.unit = unit;
    const cat = sf.category;
    if (cat !== '' && cat !== undefined && cat !== null) params.category = cat;
    if (sf.is_enabled !== undefined && sf.is_enabled !== null && sf.is_enabled !== '') {
      const v = typeof sf.is_enabled === 'boolean' ? (sf.is_enabled ? 1 : 0) : Number(sf.is_enabled);
      params.status = v;
    } else if (sf.status !== undefined && sf.status !== null) {
      params.status = sf.status;
    }
    const res = await listMaterialPage(params);
    tableData.value = res.rows || res.data?.rows || [];
    pagination.total = res.total || res.data?.total || 0;
  } catch (e) {
    console.error('加载失败', e);
    message.error($t('page.wms.material.messages.loadFail'));
  } finally {
    loading.value = false;
  }
}

function handleSearch(formFromBar?: Record<string, any>) {
  if (formFromBar && typeof formFromBar === 'object') {
    Object.assign(searchForm, formFromBar);
  }
  pagination.current = 1;
  loadData();
}

function handleReset() {
  searchForm.materialCode = '';
  searchForm.materialName = '';
  searchForm.specification = '';
  searchForm.unit = '';
  searchForm.category = '';
  searchForm.status = undefined;
  searchForm.isEnabled = undefined;
  searchForm.is_enabled = undefined;
  pagination.current = 1;
  loadData();
}

// WmsDataTable 分页事件
function onPageChange({ page, pageSize }: { page: number; pageSize: number }) {
  pagination.current = page;
  pagination.pageSize = pageSize;
  loadData();
}

function onSelectionChange(keys: any[]) {
  selectedRowKeys.value = keys;
}

// 新增
function handleAdd() {
  currentEditId.value = undefined;
  modalVisible.value = true;
}

// 修改
function handleEdit(record: any) {
  currentEditId.value = record.id;
  modalVisible.value = true;
}

// 删除
async function handleDelete(id: number) {
  try {
    await deleteMaterial(id);
    message.success($t('page.wms.material.messages.deleteSuccess'));
    if (tableData.value.length === 1 && pagination.current > 1) {
      pagination.current -= 1;
    }
    loadData();
  } catch (e: any) {
    message.error($t('page.wms.material.messages.deleteFail'));
  }
}

// 批量删除
async function handleBatchDelete() {
  if (selectedRowKeys.value.length === 0) {
    message.warning($t('page.wms.material.messages.selectToDelete'));
    return;
  }
  try {
    for (const id of selectedRowKeys.value) {
      await deleteMaterial(Number(id));
    }
    message.success($t('page.wms.material.messages.deleteSuccess'));
    selectedRowKeys.value = [];
    pagination.current = 1;
    loadData();
  } catch (e: any) {
    message.error($t('page.wms.material.messages.batchDeleteFail'));
  }
}

// 状态切换
async function handleToggleStatus(record: any, checked: boolean) {
  try {
    await toggleMaterialStatus(record.id, checked ? 1 : 0);
    message.success(checked ? $t('page.wms.material.messages.enableSuccess') : $t('page.wms.material.messages.disableSuccess'));
    loadData();
  } catch (e: any) {
    message.error($t('page.wms.material.messages.statusToggleFail'));
    loadData();
  }
}

// 弹窗保存成功回调
function handleModalSuccess() {
  loadData();
}

onMounted(() => {
  loadData();
});
</script>
