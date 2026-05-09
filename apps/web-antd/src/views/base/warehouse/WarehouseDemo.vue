<template>
  <Page>
    <div class="warehouse-demo">
      <h2 class="page-title">公共组件 Demo - 仓库管理</h2>

      <WmsSearchBar
        v-model="searchForm"
        :fields="staticFields"
        :remote-fields-url="remoteFieldsUrl"
        cache-key="warehouse-demo-fields"
        @search="onSearch"
        @reset="onReset"
      />

      <div class="toolbar">
        <a-button type="default" @click="toggleRemoteMode">
          {{ remoteFieldsUrl ? '使用静态字段' : '模拟远程接口' }}
        </a-button>
      </div>

      <WmsDataTable
        :columns="tableColumns"
        :data-source="tableData"
        :loading="false"
        :pagination="pagination"
        row-key="id"
        enable-selection
        @page-change="onPageChange"
        @selection-change="onSelectionChange"
      >
        <template #bodyCell="{ column, record, text }">
          <template v-if="column.key === 'isEnabled'">
            <a-tag :color="record.isEnabled ? 'green' : 'red'">
              {{ record.isEnabled ? '启用' : '禁用' }}
            </a-tag>
          </template>
        </template>
      </WmsDataTable>
    </div>
  </Page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Button as AButton, Tag as ATag } from 'ant-design-vue';
import { Page } from '@vben/common-ui';
import WmsSearchBar from '#/components/common/WmsSearchBar.vue';
import WmsDataTable from '#/components/common/WmsDataTable.vue';

const staticFields = [
  { key: 'warehouseCode', label: '仓库编码', type: 'input' as const },
  { key: 'warehouseName', label: '仓库名称', type: 'input' as const },
  {
    key: 'warehouseType',
    label: '仓库类型',
    type: 'select' as const,
    options: [
      { label: '自营仓', value: 'self' },
      { label: '第三方仓', value: '3pl' },
      { label: '虚拟仓', value: 'virtual' },
    ],
  },
  {
    key: 'isEnabled',
    label: '是否启用',
    type: 'select' as const,
    options: [
      { label: '启用', value: '1' },
      { label: '禁用', value: '0' },
    ],
  },
];

const remoteFieldsUrl = ref<string>('');

const searchForm = ref<Record<string, any>>({});

const tableColumns = [
  { title: '仓库编码', dataIndex: 'warehouseCode', key: 'warehouseCode' },
  { title: '仓库名称', dataIndex: 'warehouseName', key: 'warehouseName' },
  { title: '仓库类型', dataIndex: 'warehouseTypeText', key: 'warehouseType' },
  { title: '是否启用', dataIndex: 'isEnabled', key: 'isEnabled' },
  { title: '地址', dataIndex: 'address', key: 'address' },
];

const tableData = [
  {
    id: '1',
    warehouseCode: 'WH001',
    warehouseName: '华东一号仓',
    warehouseTypeText: '自营仓',
    isEnabled: true,
    address: '上海市浦东新区',
  },
  {
    id: '2',
    warehouseCode: 'WH002',
    warehouseName: '华南二号仓',
    warehouseTypeText: '自营仓',
    isEnabled: true,
    address: '广州市番禺区',
  },
  {
    id: '3',
    warehouseCode: 'WH003',
    warehouseName: '北京三号仓',
    warehouseTypeText: '第三方仓',
    isEnabled: false,
    address: '北京市通州区',
  },
  {
    id: '4',
    warehouseCode: 'WH004',
    warehouseName: '成都四号仓',
    warehouseTypeText: '虚拟仓',
    isEnabled: true,
    address: '成都市双流区',
  },
  {
    id: '5',
    warehouseCode: 'WH005',
    warehouseName: '武汉五号仓',
    warehouseTypeText: '自营仓',
    isEnabled: true,
    address: '武汉市东西湖区',
  },
];

const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 5,
  showSizeChanger: true,
  showTotal: true,
});

function toggleRemoteMode() {
  remoteFieldsUrl.value = remoteFieldsUrl.value
    ? ''
    : '/api/sys/column-meta?module=warehouse';
}

function onSearch(values: Record<string, any>) {
  // eslint-disable-next-line no-console
  console.log('搜索:', values);
}

function onReset() {
  // eslint-disable-next-line no-console
  console.log('重置');
}

function onPageChange({ page, pageSize }: { page: number; pageSize: number }) {
  pagination.value.current = page;
  pagination.value.pageSize = pageSize;
  // eslint-disable-next-line no-console
  console.log('分页变化:', { page, pageSize });
}

function onSelectionChange(selectedRowKeys: any[]) {
  // eslint-disable-next-line no-console
  console.log('勾选变化:', selectedRowKeys);
}
</script>

<style scoped>
.warehouse-demo {
  padding: 16px;
}
.page-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
}
.toolbar {
  margin: 16px 0;
  text-align: right;
}
</style>
