<template>
  <Page auto-content-height>
    <div class="p-4">
      <!-- 搜索栏 -->
      <Card class="mb-4">
        <Form :model="searchForm" layout="inline">
          <FormItem label="库位编码" name="locationCode">
            <Input v-model:value="searchForm.locationCode" placeholder="请输入库位编码" style="width: 150px" />
          </FormItem>
          <FormItem label="库位名称" name="locationName">
            <Input v-model:value="searchForm.locationName" placeholder="请输入库位名称" style="width: 150px" />
          </FormItem>
          <FormItem label="状态" name="isEnabled">
            <Select v-model:value="searchForm.isEnabled" placeholder="请选择状态" style="width: 120px" allow-clear>
              <SelectOption :value="1">启用</SelectOption>
              <SelectOption :value="0">停用</SelectOption>
            </Select>
          </FormItem>
          <FormItem>
            <Space>
              <Button type="primary" @click="handleSearch">
                <IconifyIcon icon="material-symbols:search" class="mr-1" /> 搜索
              </Button>
              <Button @click="handleReset">
                <IconifyIcon icon="material-symbols:refresh" class="mr-1" /> 重置
              </Button>
            </Space>
          </FormItem>
        </Form>
      </Card>

      <!-- 工具栏 -->
      <div class="mb-4 flex gap-2">
        <Button type="primary" @click="handleEdit()">
          <IconifyIcon icon="material-symbols:add" class="mr-1" /> 新增
        </Button>
        <Popconfirm title="是否确认批量删除?" ok-text="确认" cancel-text="取消" @confirm="handleBatchDelete">
          <Button danger :disabled="selectedRowKeys.length === 0">
            <IconifyIcon icon="material-symbols:delete" class="mr-1" /> 删除
          </Button>
        </Popconfirm>
      </div>

      <!-- 表格 -->
      <Table 
        :columns="columns" 
        :data-source="dataList" 
        :loading="loading"
        :pagination="pagination"
        :row-key="(record: any) => record.id"
        :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
        bordered
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'seq'">
            {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
          </template>
          <template v-else-if="column.key === 'isEnabled'">
            <Switch
              :checked="record.isEnabled === 1"
              checked-children="启用"
              un-checked-children="停用"
              @change="(checked: boolean) => handleChangeStatus(record, checked)"
            />
          </template>
          <template v-else-if="column.key === 'action'">
            <Button type="link" size="small" @click="handleEdit(record)">修改</Button>
            <Popconfirm title="是否确认删除?" ok-text="确认" cancel-text="取消" @confirm="handleDelete(record.id)">
              <Button danger type="link" size="small">删除</Button>
            </Popconfirm>
          </template>
        </template>
      </Table>
    </div>

    <!-- 新增/修改弹窗 -->
    <Modal v-model:open="modalVisible" :title="modalTitle" @ok="handleSubmit" width="600px">
      <Form :model="formData" :label-col="{ span: 6 }">
        <FormItem label="库位编码" name="locationCode" required>
          <Input v-model:value="formData.locationCode" placeholder="请输入库位编码" />
        </FormItem>
        <FormItem label="库位名称" name="locationName" required>
          <Input v-model:value="formData.locationName" placeholder="请输入库位名称" />
        </FormItem>
        <FormItem label="库位类型" name="locationType">
          <Input v-model:value="formData.locationType" placeholder="请输入库位类型" />
        </FormItem>
        <FormItem label="所属仓库" name="warehouseId">
          <Input v-model:value="formData.warehouseId" placeholder="请输入所属仓库ID" />
        </FormItem>
        <FormItem label="状态" name="isEnabled">
          <Switch v-model:checked="formData.isEnabled" checked-children="启用" un-checked-children="停用" />
        </FormItem>
        <FormItem label="备注" name="remark">
          <Textarea v-model:value="formData.remark" placeholder="请输入备注" :rows="3" />
        </FormItem>
      </Form>
    </Modal>
  </Page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { Button, Table, Switch, Popconfirm, Modal, Form, FormItem, Input, Textarea, Select, SelectOption, Card, Space } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { Page } from '@vben/common-ui';

import {
  getLocationListApi,
  addLocationApi,
  updateLocationApi,
  deleteLocationApi,
} from '#/api/core/location';

const columns = [
  { title: '序号', key: 'seq', width: 60 },
  { title: '库位编码', dataIndex: 'locationCode', width: 150 },
  { title: '库位名称', dataIndex: 'locationName', width: 150 },
  { title: '库位类型', dataIndex: 'locationType', width: 120 },
  { title: '所属仓库ID', dataIndex: 'warehouseId', width: 100 },
  { title: '状态', key: 'isEnabled', width: 80 },
  { title: '操作', key: 'action', width: 120, fixed: 'right' },
];

const dataList = ref<any[]>([]);
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
  locationCode: '',
  locationName: '',
  isEnabled: undefined as number | undefined,
});

// 弹窗
const modalVisible = ref(false);
const modalTitle = ref('新增库位');
const isEdit = ref(false);
const formData = reactive({
  id: undefined as number | undefined,
  locationCode: '',
  locationName: '',
  locationType: '',
  warehouseId: '',
  isEnabled: true,
  remark: '',
});

// 加载列表
async function loadData() {
  loading.value = true;
  try {
    const params = {
      ...searchForm,
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
    };
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === undefined) {
        delete params[key];
      }
    });
    const res = await getLocationListApi(params);
    dataList.value = res.rows || res.data?.rows || [];
    pagination.total = res.total || res.data?.total || 0;
  } catch (e) {
    console.error('加载失败', e);
  } finally {
    loading.value = false;
  }
}

// 搜索
function handleSearch() {
  pagination.current = 1;
  loadData();
}

// 重置
function handleReset() {
  searchForm.locationCode = '';
  searchForm.locationName = '';
  searchForm.isEnabled = undefined;
  pagination.current = 1;
  loadData();
}

// 选择行
function onSelectChange(keys: any[]) {
  selectedRowKeys.value = keys;
}

// 新增/修改
function handleEdit(row?: any) {
  if (row) {
    isEdit.value = true;
    modalTitle.value = '修改库位';
    Object.assign(formData, row, { isEnabled: row.isEnabled === 1 });
  } else {
    isEdit.value = false;
    modalTitle.value = '新增库位';
    Object.assign(formData, {
      id: undefined,
      locationCode: '',
      locationName: '',
      locationType: '',
      warehouseId: '',
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
      await updateLocationApi(data);
      message.success('修改成功');
    } else {
      await addLocationApi(data);
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
    await deleteLocationApi(id);
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
      await deleteLocationApi(id);
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
    await updateLocationApi({
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

onMounted(() => {
  loadData();
});
</script>
